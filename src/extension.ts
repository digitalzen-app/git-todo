import * as vscode from "vscode";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

interface Task {
  done: boolean;
  text: string;
  createdAt: string;   // ISO string
  completedAt?: string; // ISO string
}


export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "gitTodo.openPanel",
    async () => {
      try {
        const cwd = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";

        if (!cwd) {
          vscode.window.showErrorMessage("No workspace folder found. Please open a folder to use Git TODO.");
          return;
        }

        // Print to console (Extension Host log)
        console.log("Git TODO running in:", cwd);

        // Show popup in VSCode
        // vscode.window.showInformationMessage("Git TODO running in: " + cwd);

        const result = await getBranchDescription(cwd);
        
        const panel = vscode.window.createWebviewPanel(
          "gitBranchTodo",
          "Git Branch TODO",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );

        if (result.error) {
          panel.webview.html = renderErrorHtml(result.error);
          return;
        }

        const { branchName, description } = result;
        const tasks = parseTasks(description!);

        panel.webview.html = renderHtml(tasks, branchName!);

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'update') {
                try {
                    const newMd = tasksToMarkdown(message.tasks);
                    await setBranchDescription(cwd!, branchName!, newMd);
                } catch (err: any) {
                    panel.webview.postMessage({ 
                        command: 'showError', 
                        error: err.message || "Failed to save tasks"
                    });
                }
            } else if (message.command === 'confirmDelete') {
                const result = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete "${message.taskText}"?`,
                    { modal: true },
                    'Delete'
                );
                if (result === 'Delete') {
                    panel.webview.postMessage({ 
                        command: 'deleteConfirmed', 
                        taskIndex: message.taskIndex 
                    });
                }
            }
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(err.message || "An error occurred");
      }
    }
  );

  context.subscriptions.push(disposable);
}



async function getBranchDescription(cwd: string): Promise<{ branchName?: string; description?: string; error?: string }> {
    try {
        // Check if we're in a git repository
        await exec('git rev-parse --git-dir', { cwd });
    } catch {
        return { error: "This folder is not a Git repository. Please open a folder that contains a Git repository to use Git TODO." };
    }

    try {
        const { stdout: branch } = await exec('git rev-parse --abbrev-ref HEAD', { cwd });
        const branchName = branch.trim();

        if (!branchName || branchName === 'HEAD') {
            return { error: "Unable to determine the current Git branch. You may be in a detached HEAD state." };
        }

        try {
            const { stdout } = await exec(`git config branch.${branchName}.description`, { cwd });
            return { branchName, description: stdout };
        } catch {
            // Test if we can write git config by attempting to set the description
            try {
                await exec(`git config branch.${branchName}.description ""`, { cwd });
                return { branchName, description: "" }; // no description yet, but we can write
            } catch {
                return { error: `Cannot write branch description for '${branchName}'. This may be due to insufficient permissions or Git configuration issues.` };
            }
        }
    } catch {
        return { error: "Failed to get Git branch information. Make sure you have Git installed and this is a valid Git repository." };
    }
}

async function setBranchDescription(cwd: string, branchName: string, content: string) {
    try {
        await exec(`git config branch.${branchName}.description "${content.replace(/"/g, '\\"')}"`, { cwd });
    } catch (error: any) {
        throw new Error(`Failed to save TODO list: ${error.message || 'Unknown Git error'}`);
    }
}


function parseTasks(md: string): Task[] {
  return md
    .split("\n")
    .map((line): Task | null => {
      const match = line.match(/^(\[.\])\s+(.*?)(\s+<!--(.*?)-->)?$/);
      if (!match) return null;

      const done = match[1] === "[X]";
      const text = match[2].trim();
      const meta = match[4] ? JSON.parse(match[4]) : {};

      return {
        done,
        text,
        createdAt: meta.createdAt || new Date().toISOString(),
        completedAt: done
          ? meta.completedAt || new Date().toISOString()
          : undefined,
      };
    })
    .filter((t): t is Task => t !== null);
}


function tasksToMarkdown(tasks: Task[]) {
  return tasks
    .map((t) => {
      const meta = {
        createdAt: t.createdAt,
        ...(t.done ? { completedAt: t.completedAt } : {}),
      };
      return `${t.done ? "[X]" : "[ ]"} ${t.text} <!--${JSON.stringify(meta)}-->`;
    })
    .join("\n");
}

function renderErrorHtml(errorMessage: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 24px;
                line-height: 1.6;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }

            .error-container {
                max-width: 500px;
                text-align: center;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                border-radius: 12px;
                padding: 40px 32px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            }

            .error-icon {
                font-size: 48px;
                margin-bottom: 20px;
                opacity: 0.8;
            }

            .error-title {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--vscode-inputValidation-errorForeground);
            }

            .error-message {
                font-size: 14px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 24px;
                line-height: 1.5;
            }

            .error-suggestions {
                background: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-textBlockQuote-border);
                border-radius: 8px;
                padding: 20px;
                text-align: left;
                margin-top: 20px;
            }

            .error-suggestions h4 {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--vscode-foreground);
            }

            .error-suggestions ul {
                list-style: none;
                padding: 0;
            }

            .error-suggestions li {
                font-size: 13px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 8px;
                padding-left: 20px;
                position: relative;
                line-height: 1.4;
            }

            .error-suggestions li:before {
                content: "•";
                position: absolute;
                left: 0;
                color: var(--vscode-button-background);
                font-weight: bold;
            }

            .error-code {
                background: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                padding: 2px 6px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: var(--vscode-textPreformat-foreground);
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-title">Git TODO Error</div>
            <div class="error-message">${errorMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}</div>
            
            <div class="error-suggestions">
                <h4>💡 Suggestions:</h4>
                <ul>
                    <li>Make sure you're in a Git repository folder</li>
                    <li>Check that Git is installed and accessible</li>
                    <li>Verify you have write permissions to the repository</li>
                    <li>Try running <span class="error-code">git status</span> in the terminal</li>
                    <li>If in a detached HEAD state, checkout a branch first</li>
                </ul>
            </div>
        </div>

        <script>
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
        </script>
    </body>
    </html>`;
}

function renderHtml(tasks: any[], branchName: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 24px;
                line-height: 1.6;
            }

            .container {
                max-width: 800px;
                margin: 0 auto;
            }

            h2 { 
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                color: var(--vscode-foreground);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .header-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .branch-info {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                opacity: 0.9;
            }

            .branch-icon {
                font-size: 10px;
            }

            .header-icon {
                width: 24px;
                height: 24px;
                background: var(--vscode-button-background);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .add-task-section {
                display: none;
            }

            .header-add-task {
                display: flex;
                gap: 8px;
                align-items: center;
                flex: 1;
                max-width: 300px;
            }

            .header-add-task input[type="text"] {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 6px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-size: 12px;
                transition: all 0.2s ease;
                outline: none;
            }

            .header-add-task input[type="text"]:focus {
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 0 0 1px var(--vscode-focusBorder);
            }

            .header-add-task .btn {
                padding: 8px 12px;
                font-size: 12px;
            }

            .add-task-form {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            input[type="text"] { 
                flex: 1;
                padding: 10px 12px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 6px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-size: 13px;
                transition: all 0.2s ease;
                outline: none;
            }

            input[type="text"]:focus {
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }

            .btn {
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                text-decoration: none;
                outline: none;
            }

            .btn-primary {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .btn-primary:hover {
                background: var(--vscode-button-hoverBackground);
                transform: translateY(-1px);
            }

            .btn-primary .btn-icon {
                filter: brightness(1.2) contrast(1.1);
                font-weight: 600;
            }

            .btn-secondary {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                padding: 6px 10px;
                font-size: 11px;
            }

            .btn-secondary:hover {
                background: var(--vscode-button-secondaryHoverBackground);
                transform: scale(1.05);
            }

            .btn-danger {
                background: var(--vscode-inputValidation-errorBackground);
                color: var(--vscode-inputValidation-errorForeground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 6px 10px;
                font-size: 11px;
            }

            .btn-danger:hover {
                background: var(--vscode-inputValidation-errorBackground);
                opacity: 0.8;
                transform: scale(1.05);
            }

            .tasks-container {
                background: var(--vscode-editor-background);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid var(--vscode-panel-border);
            }

            .tasks-header {
                background: var(--vscode-titleBar-activeBackground);
                padding: 12px 16px;
                border-bottom: 1px solid var(--vscode-panel-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .tasks-count {
                font-size: 13px;
                color: var(--vscode-descriptionForeground);
                font-weight: 500;
            }

            .header-stats {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .stat-mini {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
            }

            .stat-mini .stat-icon {
                font-size: 10px;
            }

            ul { 
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .task-item { 
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid var(--vscode-panel-border);
                background: var(--vscode-list-inactiveSelectionBackground);
                transition: all 0.2s ease;
                cursor: move;
                position: relative;
            }

            .task-item:last-child {
                border-bottom: none;
            }

            .task-item:hover {
                background: var(--vscode-list-hoverBackground);
                transform: translateX(2px);
            }

            .task-item.dragging {
                opacity: 0.5;
                transform: rotate(5deg) scale(1.02);
                z-index: 1000;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            }

            .task-item.drag-over {
                border-top: 3px solid var(--vscode-focusBorder);
            }

            .drag-handle {
                margin-right: 10px;
                color: var(--vscode-descriptionForeground);
                cursor: grab;
                opacity: 0.6;
                transition: opacity 0.2s ease;
            }

            .task-item:hover .drag-handle {
                opacity: 1;
            }

            .drag-handle:active {
                cursor: grabbing;
            }

            .task-checkbox {
                margin-right: 12px;
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: var(--vscode-button-background);
            }

            .task-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .task-text {
                font-size: 14px;
                line-height: 1.4;
                color: var(--vscode-editor-foreground);
                cursor: pointer;
                word-break: break-word;
            }

            .task-text-input {
                font-size: 14px;
                line-height: 1.4;
                color: var(--vscode-input-foreground);
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-focusBorder);
                border-radius: 4px;
                padding: 4px 8px;
                width: 100%;
                outline: none;
                font-family: inherit;
            }

            .task-text-input:focus {
                box-shadow: 0 0 0 1px var(--vscode-focusBorder);
            }

            .task-item.completed .task-text {
                text-decoration: line-through;
                opacity: 0.6;
            }

            .task-meta {
                display: flex;
                gap: 12px;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-top: 2px;
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .task-actions {
                display: flex;
                gap: 6px;
                margin-left: 12px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .task-item:hover .task-actions {
                opacity: 1;
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--vscode-descriptionForeground);
            }

            .empty-icon {
                font-size: 36px;
                margin-bottom: 12px;
                opacity: 0.5;
            }

            .empty-title {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--vscode-foreground);
            }

            .empty-description {
                font-size: 13px;
                opacity: 0.8;
            }

            .stats {
                display: none;
            }

            .stat-card {
                flex: 1;
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }

            .stat-number {
                font-size: 20px;
                font-weight: 600;
                color: var(--vscode-foreground);
                display: block;
            }

            .stat-label {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 4px;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .task-item {
                animation: slideIn 0.3s ease-out;
            }

            .task-section-header {
                background: var(--vscode-sideBar-background);
                padding: 8px 16px;
                border-bottom: 1px solid var(--vscode-panel-border);
                font-size: 12px;
                font-weight: 600;
                color: var(--vscode-foreground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .error-banner {
                background: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                border-radius: 8px;
                margin-bottom: 16px;
                animation: slideIn 0.3s ease-out;
            }

            .error-content {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 12px;
            }

            .error-icon {
                font-size: 16px;
                flex-shrink: 0;
            }

            .error-text {
                flex: 1;
                font-size: 13px;
                color: var(--vscode-inputValidation-errorForeground);
                line-height: 1.4;
            }

            .error-close {
                background: none;
                border: none;
                color: var(--vscode-inputValidation-errorForeground);
                cursor: pointer;
                font-size: 14px;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .error-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>
                <div class="header-title">
                    <div class="header-icon">📋</div>
                    <span>Git Branch TODO</span>
                    <div class="branch-info">
                        <span class="branch-icon">🌿</span>
                        <span>${branchName}</span>
                    </div>
                </div>
                <div class="header-add-task">
                    <input id="newTask" type="text" placeholder="Add a new task..." />
                    <button class="btn btn-primary" id="addTaskBtn">
                        <span class="btn-icon">+</span> Add
                    </button>
                </div>
            </h2>

            <div class="stats" id="stats"></div>

            <div class="add-task-section">
                <div class="add-task-form">
                    <input id="newTask" type="text" placeholder="What needs to be done?" />
                    <button class="btn btn-primary" id="addTaskBtn">
                        ➕ Add Task
                    </button>
                </div>
            </div>

            <div class="tasks-container">
                <div class="tasks-header">
                    <div class="header-left">
                        <div class="tasks-count" id="tasksCount"></div>
                        <div class="header-stats" id="headerStats"></div>
                    </div>
                    <div style="font-size: 11px; color: var(--vscode-descriptionForeground);">
                        💡 Drag to reorder • Click ✏️ to edit
                    </div>
                </div>
                <ul id="list"></ul>
                <div class="empty-state" id="emptyState" style="display: none;">
                    <div class="empty-icon">✨</div>
                    <div class="empty-title">No tasks yet</div>
                    <div class="empty-description">Add your first task to get started</div>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let tasks = ${JSON.stringify(tasks)};
            let draggedIndex = null;

            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(t => t.done).length;
                const pending = total - completed;
                
                // Update header stats
                document.getElementById('headerStats').innerHTML = \`
                    <div class="stat-mini">
                        <span class="stat-icon">📊</span>
                        <span>\${total}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-icon">⏳</span>
                        <span>\${pending}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-icon">✅</span>
                        <span>\${completed}</span>
                    </div>
                \`;

                document.getElementById('tasksCount').textContent = 
                    total === 0 ? 'No tasks' : 
                    total === 1 ? '1 task' : 
                    \`\${total} tasks\`;
            }

            function render() {
                const list = document.getElementById('list');
                const emptyState = document.getElementById('emptyState');
                
                if (tasks.length === 0) {
                    list.style.display = 'none';
                    emptyState.style.display = 'block';
                } else {
                    list.style.display = 'block';
                    emptyState.style.display = 'none';
                }

                list.innerHTML = '';
                
                // Separate tasks into pending and completed
                const pendingTasks = tasks.filter(t => !t.done);
                const completedTasks = tasks.filter(t => t.done);
                
                // Add pending tasks section
                if (pendingTasks.length > 0) {
                    const pendingHeader = document.createElement('div');
                    pendingHeader.className = 'task-section-header';
                    pendingHeader.innerHTML = \`
                        <div class="section-icon">⏳</div>
                        Pending Tasks (\${pendingTasks.length})
                    \`;
                    list.appendChild(pendingHeader);
                    
                    pendingTasks.forEach((t, originalIndex) => {
                        const taskIndex = tasks.indexOf(t);
                        list.appendChild(createTaskElement(t, taskIndex));
                    });
                }
                
                // Add completed tasks section
                if (completedTasks.length > 0) {
                    const completedHeader = document.createElement('div');
                    completedHeader.className = 'task-section-header';
                    completedHeader.innerHTML = \`
                        <div class="section-icon">✅</div>
                        Completed Tasks (\${completedTasks.length})
                    \`;
                    list.appendChild(completedHeader);
                    
                    completedTasks.forEach((t, originalIndex) => {
                        const taskIndex = tasks.indexOf(t);
                        list.appendChild(createTaskElement(t, taskIndex));
                    });
                }

                updateStats();
            }

            function createTaskElement(t, i) {
                const li = document.createElement('li');
                li.className = \`task-item \${t.done ? 'completed' : ''}\`;
                li.draggable = true;
                li.dataset.index = i;
                
                const createdDate = new Date(t.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const completedHtml = t.done && t.completedAt ? 
                    \`<div class="meta-item">✅ \${new Date(t.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>\` : '';

                li.innerHTML = \`
                    <div class="drag-handle">⋮⋮</div>
                    <input type="checkbox" class="task-checkbox" \${t.done ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-text">\${escapeHtml(t.text)}</div>
                        <div class="task-meta">
                            <div class="meta-item">📅 \${createdDate}</div>
                            \${completedHtml}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-secondary edit-btn" title="Edit task">✏️</button>
                        <button class="btn btn-danger delete-btn" title="Delete task">🗑️</button>
                    </div>
                \`;

                // Add event listeners
                const checkbox = li.querySelector('.task-checkbox');
                const deleteBtn = li.querySelector('.delete-btn');
                const editBtn = li.querySelector('.edit-btn');
                const taskText = li.querySelector('.task-text');

                checkbox.addEventListener('change', (e) => {
                    toggle(i, e.target.checked);
                });

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeTask(i);
                });

                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editTask(i);
                });

                taskText.addEventListener('dblclick', () => {
                    editTask(i);
                });

                // Add drag event listeners
                li.addEventListener('dragstart', handleDragStart);
                li.addEventListener('dragover', handleDragOver);
                li.addEventListener('drop', handleDrop);
                li.addEventListener('dragend', handleDragEnd);
                li.addEventListener('dragenter', handleDragEnter);
                li.addEventListener('dragleave', handleDragLeave);

                return li;
            }

            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Drag and drop functionality
            function handleDragStart(e) {
                draggedIndex = parseInt(e.target.dataset.index);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }

            function handleDragOver(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }

            function handleDragEnter(e) {
                e.preventDefault();
                if (e.target.classList.contains('task-item')) {
                    e.target.classList.add('drag-over');
                }
            }

            function handleDragLeave(e) {
                if (e.target.classList.contains('task-item')) {
                    e.target.classList.remove('drag-over');
                }
            }

            function handleDrop(e) {
                e.preventDefault();
                const dropIndex = parseInt(e.target.closest('.task-item').dataset.index);
                
                if (draggedIndex !== null && draggedIndex !== dropIndex) {
                    // Remove the dragged task from its original position
                    const draggedTask = tasks.splice(draggedIndex, 1)[0];
                    
                    // Insert it at the new position
                    tasks.splice(dropIndex, 0, draggedTask);
                    
                    // Update the backend
                    vscode.postMessage({ command: 'update', tasks });
                    render();
                }
                
                // Clean up
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            }

            function handleDragEnd(e) {
                e.target.classList.remove('dragging');
                draggedIndex = null;
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            }

            function toggle(i, checked) {
                tasks[i].done = checked;
                tasks[i].completedAt = checked ? new Date().toISOString() : undefined;
                vscode.postMessage({ command: 'update', tasks });
                render();
            }

            function addTask() {
                const input = document.getElementById('newTask');
                if (input.value.trim()) {
                    tasks.push({ 
                        done: false, 
                        text: input.value.trim(),
                        createdAt: new Date().toISOString()
                    });
                    vscode.postMessage({ command: 'update', tasks });
                    input.value = '';
                    render();
                    
                    // Focus the input for quick task addition
                    setTimeout(() => input.focus(), 100);
                }
            }

            function removeTask(i) {
                // Send message to VS Code to show confirmation dialog
                vscode.postMessage({ 
                    command: 'confirmDelete', 
                    taskIndex: i,
                    taskText: tasks[i].text 
                });
            }

            function editTask(i) {
                const taskElement = document.querySelector(\`[data-index="\${i}"] .task-text\`);
                if (!taskElement || taskElement.classList.contains('editing')) return;
                
                const currentText = tasks[i].text;
                
                // Create input element
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'task-text-input';
                input.value = currentText;
                
                // Replace text with input
                taskElement.style.display = 'none';
                taskElement.classList.add('editing');
                taskElement.parentNode.insertBefore(input, taskElement.nextSibling);
                
                // Focus and select all text
                input.focus();
                input.select();
                
                function saveEdit() {
                    const newText = input.value.trim();
                    if (newText && newText !== currentText) {
                        tasks[i].text = newText;
                        vscode.postMessage({ command: 'update', tasks });
                    }
                    
                    // Restore original text element
                    taskElement.textContent = newText || currentText;
                    taskElement.style.display = '';
                    taskElement.classList.remove('editing');
                    input.remove();
                }
                
                function cancelEdit() {
                    taskElement.style.display = '';
                    taskElement.classList.remove('editing');
                    input.remove();
                }
                
                // Save on Enter, cancel on Escape
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });
                
                // Save when losing focus
                input.addEventListener('blur', saveEdit);
                
                // Prevent drag when editing
                input.addEventListener('mousedown', (e) => e.stopPropagation());
                input.addEventListener('dragstart', (e) => e.preventDefault());
            }

            // Enter-to-save and button click
            document.getElementById('newTask').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    addTask();
                }
            });

            document.getElementById('addTaskBtn').addEventListener('click', () => {
                addTask();
            });

            // Focus the input on load
            document.addEventListener('DOMContentLoaded', () => {
                document.getElementById('newTask').focus();
            });

            // Listen for messages from VS Code
            window.addEventListener('message', event => {
                const message = event.data;
                
                if (message.command === 'deleteConfirmed') {
                    tasks.splice(message.taskIndex, 1);
                    vscode.postMessage({ command: 'update', tasks });
                    render();
                } else if (message.command === 'showError') {
                    showErrorMessage(message.error);
                }
            });

            function showErrorMessage(errorText) {
                // Remove any existing error messages
                const existingError = document.querySelector('.error-banner');
                if (existingError) {
                    existingError.remove();
                }
                
                // Create error banner
                const errorBanner = document.createElement('div');
                errorBanner.className = 'error-banner';
                errorBanner.innerHTML = \`
                    <div class="error-content">
                        <span class="error-icon">⚠️</span>
                        <span class="error-text">\${errorText}</span>
                        <button class="error-close" onclick="this.parentElement.parentElement.remove()">✕</button>
                    </div>
                \`;
                
                // Insert at the top of the container
                const container = document.querySelector('.container');
                container.insertBefore(errorBanner, container.firstChild);
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    if (errorBanner.parentNode) {
                        errorBanner.remove();
                    }
                }, 5000);
            }

            render();
        </script>
    </body>
    </html>`;
}
