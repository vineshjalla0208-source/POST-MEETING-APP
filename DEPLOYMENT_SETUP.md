# Deployment Setup Guide

## Files Created

### 1. Dockerfile
**Path:** `Dockerfile`
- Production-ready Next.js Docker image
- Multi-stage build for optimization
- Runs as non-root user for security
- Exposes port 3000

### 2. .dockerignore
**Path:** `.dockerignore`
- Excludes unnecessary files from Docker build
- Reduces image size
- Protects sensitive files

### 3. docker-compose.yml
**Path:** `docker-compose.yml`
- Local development/testing setup
- Environment variable configuration
- Network setup

### 4. GitHub Actions Workflow
**Path:** `.github/workflows/deploy.yml`
- Automated CI/CD pipeline
- Builds Docker image on push
- Pushes to Docker Hub
- Deploys to server via SSH

## GitHub Secrets Required

Add these secrets in your GitHub repository settings:
**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

1. **DOCKER_HUB_USERNAME** - Your Docker Hub username
2. **DOCKER_HUB_TOKEN** - Docker Hub access token
3. **SSH_HOST** - Your server IP address or hostname
4. **SSH_USERNAME** - SSH username for deployment
5. **SSH_PRIVATE_KEY** - Private SSH key for server access
6. **SSH_PORT** - SSH port (default: 22, optional)

### Environment Variables (from GitHub Secrets):

7. **SUPABASE_URL** - Your Supabase project URL
8. **SUPABASE_ANON_KEY** - Supabase anonymous key
9. **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key
10. **SUPABASE_JWT_SECRET** - Supabase JWT secret
11. **NEXTAUTH_SECRET** - NextAuth secret (min 32 chars)
12. **NEXTAUTH_URL** - Your app URL (e.g., https://yourdomain.com)
13. **GOOGLE_CLIENT_ID** - Google OAuth client ID
14. **GOOGLE_CLIENT_SECRET** - Google OAuth client secret
15. **GOOGLE_REDIRECT_URI** - Google OAuth redirect URI
16. **RECALL_API_KEY** - Recall.ai API key (optional)
17. **RECALL_BASE_URL** - Recall.ai base URL (optional)

## Setup Instructions

### Step 1: Configure GitHub Secrets

1. Go to: https://github.com/vineshjalla0208-source/POST-MEETING-APP/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret listed above

### Step 2: Get Docker Hub Token

1. Go to: https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it (e.g., "github-actions")
4. Copy the token and add as `DOCKER_HUB_TOKEN` secret

### Step 3: Prepare SSH Key for Deployment

1. Generate SSH key pair (if not exists):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   ```

2. Add public key to server:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server
   ```

3. Copy private key content and add as `SSH_PRIVATE_KEY` secret:
   ```bash
   cat ~/.ssh/id_ed25519
   ```

### Step 4: Update next.config.js

The `next.config.js` has been updated to include `output: 'standalone'` for Docker builds.

### Step 5: Test Locally (Optional)

```bash
# Build Docker image
docker build -t post-meeting-app .

# Run with docker-compose
docker-compose up

# Or run directly
docker run -p 3000:3000 --env-file .env.local post-meeting-app
```

## Deployment Flow

1. **Push to main branch** → Triggers workflow
2. **Build job** → Builds Docker image
3. **Push to Docker Hub** → Uploads image
4. **Deploy job** → SSH to server and runs container

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# On your server
docker pull your-dockerhub-username/post-meeting-app:latest
docker stop post-meeting-app || true
docker rm post-meeting-app || true
docker run -d \
  --name post-meeting-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  your-dockerhub-username/post-meeting-app:latest
```

## Troubleshooting

### Build fails
- Check GitHub Actions logs
- Verify all secrets are set
- Ensure Docker Hub credentials are correct

### Deployment fails
- Verify SSH key is correct
- Check SSH host and port
- Ensure Docker is installed on server
- Verify server has access to Docker Hub

### Container won't start
- Check environment variables
- Verify port 3000 is available
- Check container logs: `docker logs post-meeting-app`

## Notes

- All secrets are stored securely in GitHub Secrets
- No sensitive data is committed to the repository
- Docker image is automatically built and pushed on every main branch push
- Deployment happens automatically after successful build

