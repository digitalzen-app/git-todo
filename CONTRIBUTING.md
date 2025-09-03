# Contributing to Git Branch TODO

Thank you for considering contributing to Git Branch TODO! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- VS Code
- Git

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/git-branch-todo.git
cd git-branch-todo
```

2. Install dependencies:
```bash
npm install
```

3. Open in VS Code:
```bash
code .
```

4. Start development:
```bash
npm run watch
```

5. Test the extension:
   - Press `F5` to open a new Extension Development Host window
   - Run the command "Git Branch TODO: Open Panel"

## 🎯 How to Contribute

### Reporting Bugs
1. Check if the bug is already reported in [Issues](../../issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - VS Code version, Git version, and OS
   - Screenshots if applicable

### Suggesting Features
1. Check existing [Issues](../../issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach

### Code Contributions

#### Pull Request Process
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the coding standards
3. Test your changes thoroughly
4. Update documentation if needed
5. Commit with clear, descriptive messages
6. Push to your fork and create a Pull Request

#### Coding Standards
- Use TypeScript for all new code
- Follow existing code style and formatting
- Add comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused

#### Testing
- Test the extension in different scenarios:
  - Git repositories vs non-Git folders
  - Different branch states
  - Error conditions
  - Various VS Code themes
- Ensure no TypeScript compilation errors
- Test UI responsiveness and accessibility

## 📝 Development Guidelines

### File Structure
```
src/
  ├── extension.ts      # Main extension file
  └── ...              # Additional source files

package.json           # Extension manifest
tsconfig.json         # TypeScript configuration
README.md             # Main documentation
CHANGELOG.md          # Version history
```

### Key Components
- **Extension Activation**: `activate()` function in `extension.ts`
- **Git Integration**: Functions for reading/writing branch descriptions
- **UI Rendering**: HTML/CSS/JavaScript for the webview
- **Error Handling**: Comprehensive error checking and user feedback

### Adding Features
1. Plan the feature and discuss in an issue if it's significant
2. Consider backwards compatibility
3. Add appropriate error handling
4. Update documentation
5. Test across different scenarios

## 🐛 Debugging

### Extension Development
- Use VS Code's built-in debugging for extensions
- Check the Extension Host log for console output
- Use breakpoints in TypeScript code
- Test webview functionality in DevTools

### Common Issues
- **Git not found**: Ensure Git is in PATH
- **Permission errors**: Check Git repository permissions
- **Webview issues**: Check browser console in DevTools

## 📋 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with new features/fixes
3. Create a release commit
4. Tag the release: `git tag v1.x.x`
5. Push tags: `git push --tags`
6. Package the extension: `vsce package`
7. Publish: `vsce publish`

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## 💬 Getting Help

- Create an issue for bugs or questions
- Check existing documentation
- Look at the source code for examples

Thank you for contributing to Git Branch TODO! 🎉
