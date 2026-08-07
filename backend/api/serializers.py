from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, DownloadRecord, Follow, UserProfile, CollaborationRequest

class UserSerializer(serializers.ModelSerializer):
    profile_pic = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_pic']

    def get_profile_pic(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_pic.url)
            return obj.profile.profile_pic.url
        return None

class UserProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    profile_pic = serializers.SerializerMethodField()
    social_media_links = serializers.SerializerMethodField()
    collab_email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'followers_count', 'following_count', 'is_following', 'profile_pic', 'social_media_links', 'collab_email']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_profile_pic(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_pic.url)
        return None

    def get_social_media_links(self, obj):
        return obj.profile.social_media_links if hasattr(obj, 'profile') else ""

    def get_collab_email(self, obj):
        return obj.profile.collab_email if hasattr(obj, 'profile') else ""

class CollaborationRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = CollaborationRequest
        fields = ['id', 'user', 'status', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'text', 'created_at']
        read_only_fields = ['post', 'user']

class PostSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    has_liked = serializers.SerializerMethodField()
    collaborators = UserSerializer(many=True, read_only=True)
    pending_collab_requests = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'description', 'file', 'uploaded_by', 'created_at', 'likes_count', 'download_count', 'comments', 'has_liked', 'collaborators', 'pending_collab_requests']
        read_only_fields = ['uploaded_by']

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_pending_collab_requests(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.uploaded_by == request.user:
            requests = obj.collab_requests.filter(status='pending')
            return CollaborationRequestSerializer(requests, many=True, context=self.context).data
        return []

class DownloadRecordSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post_title = serializers.CharField(source='post.title', read_only=True)

    class Meta:
        model = DownloadRecord
        fields = ['id', 'post_title', 'user', 'downloaded_at']
