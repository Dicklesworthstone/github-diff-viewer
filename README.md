# GitHub Diff Viewer

## Table of Contents
- [GitHub Diff Viewer](#github-diff-viewer)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Features](#features)
  - [How It Works](#how-it-works)
  - [Setup Instructions](#setup-instructions)
    - [1. Install Node.js and npm using NVM](#1-install-nodejs-and-npm-using-nvm)
    - [2. Clone the repository](#2-clone-the-repository)
    - [3. Install dependencies](#3-install-dependencies)
    - [4. Set up environment variables](#4-set-up-environment-variables)
    - [5. Run the development server](#5-run-the-development-server)
  - [Project Structure](#project-structure)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [License](#license)

## Project Overview

The GitHub Diff Viewer is a Next.js web application that allows users to view and analyze differences (diffs) between GitHub repositories or branches. It provides a user-friendly interface for exploring code changes, making it easier for developers to review and understand modifications in their projects.

## Features

- Dynamic loading of the diff viewer component for improved performance
- Server-side rendering (SSR) with Next.js for faster initial page loads
- Integration with isomorphic-git for Git operations in the browser
- GitHub API proxy to handle CORS issues and authentication
- Responsive design using Tailwind CSS
- Custom UI components for a consistent look and feel

## How It Works

1. The application uses Next.js as its core framework, providing server-side rendering and routing capabilities.
2. isomorphic-git is used to perform Git operations directly in the browser, allowing the app to fetch repository data without a backend server.
3. A custom API proxy is implemented to handle GitHub API requests, bypassing CORS restrictions and managing authentication.
4. The diff viewer component is dynamically loaded to improve initial page load times.
5. Tailwind CSS is used for styling, ensuring a responsive and modern user interface.

## Setup Instructions

Follow these steps to set up the GitHub Diff Viewer on an Ubuntu machine:

### 1. Install Node.js and npm using NVM

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install the latest LTS version of Node.js
nvm install --lts

# Use the installed version
nvm use --lts

# Verify installation
node --version
npm --version
```

### 2. Clone the repository

```bash
git clone https://github.com/Dicklesworthstone/github-diff-viewer.git
cd github-diff-viewer
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create a `.env.local` file in the project root and add the following:

```
GITHUB_ACCESS_TOKEN=your_github_personal_access_token
```

Replace `your_github_personal_access_token` with a valid GitHub Personal Access Token.

### 5. Run the development server

```bash
npm run dev
```

The application should now be running on `http://localhost:3000`.

## Project Structure

```
github-diff-viewer/
├── components/
│   ├── DynamicDiffViewer.js
│   ├── DiffViewer.js (not shown in the provided code)
│   └── ui/
│       └── button.js
├── pages/
│   ├── _app.js
│   ├── index.js
│   └── api/
│       └── proxy.js
├── styles/
│   └── globals.css (not shown in the provided code)
├── public/
├── package.json
└── next.config.js (not shown in the provided code)
```

## Usage

1. Navigate to `http://localhost:3000` in your web browser.
2. The GitHub Diff Viewer interface will be displayed.
3. (Add more specific usage instructions based on the actual functionality of your DiffViewer component)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License