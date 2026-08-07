from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Post, Comment, DownloadRecord, Follow
from .serializers import PostSerializer, CommentSerializer, DownloadRecordSerializer, UserSerializer, UserProfileSerializer
from .permissions import IsOwnerOrCollaboratorOrReadOnly
from django.http import FileResponse
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
        if email and User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            temp_user = User(username=username, email=email)
            validate_password(password, user=temp_user)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=username, password=password, email=email)
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrCollaboratorOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        queryset = Post.objects.all().order_by('-created_at')
        search_query = self.request.query_params.get('search', None)
        user_id = self.request.query_params.get('user_id', None)
        
        if search_query:
            queryset = queryset.filter(Q(title__icontains=search_query) | Q(description__icontains=search_query))
        if user_id:
            queryset = queryset.filter(uploaded_by_id=user_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            return Response({"status": "unliked", "likes_count": post.likes.count()})
        else:
            post.likes.add(user)
            return Response({"status": "liked", "likes_count": post.likes.count()})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comment(self, request, pk=None):
        post = self.get_object()
        text = request.data.get('text')
        if not text:
            return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(post=post, user=request.user, text=text)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def download(self, request, pk=None):
        post = self.get_object()
        
        # Record the download
        if request.user != post.uploaded_by:
            DownloadRecord.objects.create(post=post, user=request.user)
            
        file_handle = post.file.open()
        response = FileResponse(file_handle, as_attachment=True, filename=post.file.name.split('/')[-1])
        return response

class DashboardView(generics.ListAPIView):
    serializer_class = DownloadRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return download records for posts uploaded by the current user
        return DownloadRecord.objects.filter(post__uploaded_by=user).order_by('-downloaded_at')

from .models import UserProfile, CollaborationRequest

class UserProfileView(generics.GenericAPIView):
    serializer_class = UserProfileSerializer

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        if str(request.user.id) != str(pk):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        if 'profile_pic' in request.FILES:
            profile.profile_pic = request.FILES['profile_pic']
        if 'social_media_links' in request.data:
            profile.social_media_links = request.data['social_media_links']
        if 'collab_email' in request.data:
            profile.collab_email = request.data['collab_email']
            
        profile.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

class FollowToggleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user == target_user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        follow_record, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        
        if not created:
            follow_record.delete()
            return Response({"message": "Unfollowed user", "is_following": False})
            
        return Response({"message": "Followed user", "is_following": True})

class CollabRequestView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if post.uploaded_by == request.user:
            return Response({"error": "You cannot collaborate on your own post"}, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user in post.collaborators.all():
            return Response({"error": "Already a collaborator"}, status=status.HTTP_400_BAD_REQUEST)
            
        req, created = CollaborationRequest.objects.get_or_create(post=post, user=request.user)
        if not created:
            return Response({"message": f"Request already sent. Status: {req.status}"})
            
        return Response({"message": "Collaboration request sent successfully."})

class CollabRespondView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if post.uploaded_by != request.user:
            return Response({"error": "Only the post owner can manage collaborations"}, status=status.HTTP_403_FORBIDDEN)
            
        user_id = request.data.get('user_id')
        action = request.data.get('action') # 'accept' or 'reject'
        
        try:
            collab_req = CollaborationRequest.objects.get(post=post, user_id=user_id)
        except CollaborationRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if action == 'accept':
            collab_req.status = 'accepted'
            collab_req.save()
            post.collaborators.add(collab_req.user)
            return Response({"message": "Collaboration request accepted."})
        elif action == 'reject':
            collab_req.status = 'rejected'
            collab_req.save()
            return Response({"message": "Collaboration request rejected."})
        
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
