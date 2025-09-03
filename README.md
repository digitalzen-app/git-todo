# Git Branch TODO

A modern VS Code extension that lets you manage TODO lists for each Git branch using Git's branch description feature. Keep your tasks organized and branch-specific!

![Git Branch TODO Demo](https://via.placeholder.com/800x400/2d3748/ffffff?text=Git+Branch+TODO+Extension)

## ✨ Features

- **Branch-Specific TODOs**: Each Git branch gets its own TODO list stored in the branch description
- **Modern UI**: Clean, VS Code-themed interface that matches your editor's appearance
- **Drag & Drop Reordering**: Easily rearrange tasks by dragging them
- **Inline Editing**: Double-click any task to edit it inline
- **Task Management**: Add, edit, delete, and complete tasks with intuitive controls
- **Smart Error Handling**: Helpful error messages when Git is not available or configured
- **Persistent Storage**: Tasks are stored using Git's branch description feature
- **Task Statistics**: See pending and completed task counts at a glance
- **Timestamps**: Track when tasks were created and completed

## 🚀 Getting Started

### Prerequisites

- VS Code 1.74.0 or higher
- Git installed and accessible from the command line
- A Git repository (the extension works within Git repositories)

### Installation

#### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Git Branch TODO"
4. Click Install

#### Local Installation from Source

1. Clone and build the extension:
   ```bash
   git clone https://github.com/digitalzen-app/git-todo.git
   cd git-todo
   npm install
   npm run package
   ```

2. Install the generated `.vsix` file:
   ```bash
   code --install-extension dist/git-branch-todo.vsix
   ```

### Usage

1. Open a folder containing a Git repository
2. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "Git TODO" and select "Git Branch TODO: Open Panel"
4. Start adding your branch-specific tasks!

## 🎯 How It Works

The extension uses Git's built-in branch description feature to store TODO lists. Each branch gets its own independent list of tasks, making it perfect for:

- **Feature Development**: Keep track of implementation tasks for each feature branch
- **Bug Fixes**: List steps needed to resolve issues on dedicated fix branches
- **Code Reviews**: Note review comments and required changes
- **Project Planning**: Break down larger features into smaller, manageable tasks

## 🖱️ Interface Guide

### Header
- **Branch Badge**: Shows which Git branch you're currently working on
- **Quick Add**: Add new tasks directly from the header
- **Task Statistics**: See total, pending, and completed task counts

### Task Management
- **Add Tasks**: Use the input field and "Add" button or press Enter
- **Complete Tasks**: Click the checkbox to mark tasks as done/undone
- **Edit Tasks**: Double-click any task text or click the ✏️ edit button
- **Delete Tasks**: Click the 🗑️ delete button (with confirmation dialog)
- **Reorder Tasks**: Drag tasks using the ⋮⋮ handle to rearrange them

### Task Organization
Tasks are automatically organized into:
- **Pending Tasks**: Tasks that still need to be completed
- **Completed Tasks**: Tasks that have been marked as done

## ⚡ Commands

| Command | Description |
|---------|-------------|
| `Git Branch TODO: Open Panel` | Opens the TODO panel for the current Git branch |

## 🛠️ Error Handling

The extension provides helpful error messages for common issues:

- **Not a Git Repository**: Warns when the folder isn't a Git repository
- **Git Not Available**: Alerts when Git isn't installed or accessible
- **Permission Issues**: Notifies about write permission problems
- **Detached HEAD**: Explains when you're not on a named branch
- **Save Failures**: Shows errors when tasks can't be saved

## 📋 Data Storage

Tasks are stored using Git's branch description feature (`git config branch.<name>.description`). This means:

- ✅ **No extra files**: No additional files cluttering your repository
- ✅ **Git-native**: Uses standard Git functionality
- ✅ **Portable**: Works across different machines and Git clients
- ✅ **Lightweight**: Minimal overhead and fast performance
- ✅ **Branch-specific**: Each branch maintains its own independent TODO list

## 🎨 Customization

The extension automatically adapts to your VS Code theme, using native VS Code color variables for:
- Background colors
- Text colors  
- Button styles
- Border colors
- Focus indicators

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd git-todo

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run package
```

### Testing

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Launch Extension"
4. Press F5 to open a new Extension Development Host window

## 📝 Requirements

- **VS Code**: Version 1.74.0 or higher
- **Git**: Must be installed and accessible from command line
- **Git Repository**: Extension works within Git repositories only

## 🐛 Known Issues

- The extension requires write access to Git configuration
- Works only within Git repositories
- Branch descriptions are limited by Git's configuration constraints

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for branch-specific task management
- Built with the VS Code Extension API
- Uses Git's native branch description functionality

## 📞 Support

If you encounter any issues or have suggestions:

1. Check the [Issues](../../issues) page for existing problems
2. Create a new issue with detailed description
3. Include VS Code version, Git version, and error messages

---

**Enjoy managing your branch-specific TODOs!** 🎉
