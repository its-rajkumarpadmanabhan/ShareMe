
# Convert Django App to Django REST Framework + React Full-Stack App

This plan outlines the steps to build a modern React frontend and convert your existing Django application into a REST API backend to meet all your requirements.

## User Review Required

> [!IMPORTANT]
> **Architecture Decision**: This plan proposes using **Django REST Framework (DRF)** on the backend to serve an API, and creating a new **React (Vite) frontend** in a separate folder. The React frontend will consume the Django API. Is this architectural split acceptable to you?

> [!WARNING]
> Since we are moving to React, the existing Django HTML templates (like `base.html` you currently have open) will become obsolete. The UI will be completely rebuilt in React. Let me know if you want to keep any specific HTML structures or CSS styles from your current templates.

## Open Questions

1. **Authentication**: I propose using **JWT (JSON Web Tokens)** for secure, stateless authentication between React and Django. Is this acceptable, or would you prefer traditional Session-based authentication?
2. **File Storage**: Uploaded files will be stored in your local `media` folder by default. For a production app, you might eventually want cloud storage (like AWS S3). Should we stick to local storage for now?

## Proposed Changes

### 1. Django Backend (API)

We will modify the existing `django_web_app` to act as an API.

#### [NEW] `django_web_app/requirements.txt`
- Install `djangorestframework`, `django-cors-headers`, and `djangorestframework-simplejwt` for building the API and handling React CORS/Auth.

#### [MODIFY] `django_web_app/django_web_app/settings.py`
- Configure REST Framework, JWT Authentication, and CORS.

#### [MODIFY] `django_web_app/blog/models.py`
- Enhance the `Post` model to support all file types.
- Add `Like` and `Comment` models.
- Add a `Download` model to track who downloaded a file and when.

#### [NEW] `django_web_app/blog/serializers.py`
- Create serializers to convert Django models (Post, Comment, Like, Download) to JSON.

#### [NEW] `django_web_app/blog/views.py` (and `urls.py`)
- Create API endpoints for CRUD operations on Posts.
- Endpoints for uploading, downloading (and tracking), liking, and commenting.
- Endpoint for the uploader's Dashboard (download statistics).

### 2. React Frontend

We will create a new React application using Vite.

#### [NEW] `c:\Users\user\Desktop\File-Sharing\frontend\`
- Create a new React project in this directory.

#### [NEW] `frontend/src/App.jsx`
- Setup React Router for navigation (Home, Dashboard, Login, Signup, Post Details).
- Implement a global Context for Light/Dark mode toggling and User Authentication state.

#### [NEW] `frontend/src/components/`
- **PostCard**: A component with uniform height/width to display posts nicely in a grid.
- **Navbar**: Includes search bar, light/dark toggle, and user auth links.
- **UploadModal**: A form to select any file and add a description.

#### [NEW] `frontend/src/pages/`
- **Home**: Displays all posts with search filtering.
- **Dashboard**: Shows the logged-in user's uploads and detailed download statistics (who downloaded, total count).
- **Auth**: Login/Signup forms.

## Verification Plan

### Automated/Manual Verification
- **Backend API**: Use Postman or simple `curl` commands to ensure JWT tokens are generated correctly and API endpoints return the expected JSON.
- **Frontend UI**:
  - Run the React development server.
  - Verify that Light/Dark mode toggles correctly across all components.
  - Test the upload flow with various file types.
  - Verify that a user cannot download, like, or comment without logging in.
  - Verify that the dashboard accurately reflects downloads made by other users.
=======
# ShareMe

ShareMe is a full-stack web application featuring a Django backend and a React (Vite) frontend.

## Project Structure

- `backend/`: Django REST Framework backend API.
- `frontend/`: React frontend built with Vite.

## Prerequisites

- Node.js (for frontend)
- Python 3.x (for backend)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (if not already done, there's a `venv` at the project root):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the backend development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## License

This project is open-source and available under the [MIT License](LICENSE).
>>>>>>> f609221 (completed)
