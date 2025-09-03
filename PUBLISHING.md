# Publishing Guide for Git Branch TODO

This guide walks you through the steps to publish the Git Branch TODO extension to the VS Code Marketplace.

## 📋 Prerequisites

1. **VS Code Extension Manager (vsce)**:
   ```bash
   npm install -g vsce
   ```

2. **Azure DevOps Account**: 
   - Create an account at [dev.azure.com](https://dev.azure.com)
   - Generate a Personal Access Token (PAT)

3. **Publisher Account**:
   - Create a publisher at [marketplace.visualstudio.com](https://marketplace.visualstudio.com/manage)

## 🔧 Setup Steps

### 1. Update package.json
Make sure to update the following fields in `package.json`:
- `publisher`: Your publisher name from the marketplace
- `author`: Your name and email
- `repository`: Your GitHub repository URL
- `bugs`: Your GitHub issues URL

### 2. Create Personal Access Token
1. Go to [dev.azure.com](https://dev.azure.com)
2. Click on your profile → Personal Access Tokens
3. Create new token with **Marketplace (manage)** scope
4. Save the token securely

### 3. Login to vsce
```bash
vsce login your-publisher-name
```
Enter your Personal Access Token when prompted.

## 📦 Publishing Process

### 1. Pre-publish Checklist
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test the extension thoroughly
- [ ] Compile TypeScript: `npm run compile`
- [ ] Check for linting errors: `npm run lint`

### 2. Package the Extension
```bash
# Create a .vsix package
vsce package

# This creates: git-branch-todo-1.0.0.vsix
```

### 3. Test the Package Locally
```bash
# Install the packaged extension locally
code --install-extension git-branch-todo-1.0.0.vsix
```

### 4. Publish to Marketplace
```bash
# Publish directly
vsce publish

# Or publish a specific version
vsce publish 1.0.0

# Or publish from package
vsce publish git-branch-todo-1.0.0.vsix
```

## 🚀 Post-Publishing

### 1. Verify Publication
- Check [VS Code Marketplace](https://marketplace.visualstudio.com/)
- Search for "Git Branch TODO"
- Verify all information is correct

### 2. Update Repository
```bash
# Tag the release
git tag v1.0.0
git push --tags

# Create a GitHub release (optional)
```

### 3. Monitor and Maintain
- Monitor reviews and ratings
- Respond to user feedback
- Fix bugs and add features
- Regular updates

## 🔄 Updating the Extension

### For Minor Updates (bug fixes)
```bash
# Update version (e.g., 1.0.0 → 1.0.1)
vsce publish patch
```

### For Minor Features
```bash
# Update version (e.g., 1.0.0 → 1.1.0)
vsce publish minor
```

### For Major Changes
```bash
# Update version (e.g., 1.0.0 → 2.0.0)
vsce publish major
```

## 📊 Analytics and Metrics

After publishing, you can track:
- Download count
- Install count
- User ratings and reviews
- Usage statistics

Access these through:
- [VS Code Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- Azure DevOps analytics

## 🛠️ Troubleshooting

### Common Issues

1. **"Publisher not found"**
   - Ensure you've created a publisher account
   - Use the correct publisher name in package.json

2. **"Authentication failed"**
   - Check your Personal Access Token
   - Ensure it has Marketplace (manage) scope

3. **"Package validation failed"**
   - Check package.json for required fields
   - Ensure all files are properly included/excluded

4. **"Extension name conflicts"**
   - Choose a unique name
   - Check existing extensions in marketplace

### Getting Help
- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI Documentation](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)

## 📝 Important Notes

- **First publication**: Review process may take a few hours
- **Updates**: Usually appear within minutes
- **Name changes**: Not allowed after publishing
- **Ratings**: Cannot be removed once published
- **Marketplace listing**: Takes time to appear in search results

## 🎉 Success!

Once published, your extension will be available for millions of VS Code users worldwide. Make sure to:
- Share the extension with your community
- Continue improving based on user feedback
- Keep the extension updated and maintained

Good luck with your publication! 🚀
