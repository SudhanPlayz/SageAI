# Contributing to Sage AI

Thank you for your interest in contributing to Sage AI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the [Issues section](https://github.com/SudhanPlayz/SageAI/issues)
2. If not, create a new issue with:
    - A clear, descriptive title
    - Steps to reproduce the bug
    - Expected behavior
    - Actual behavior
    - Screenshots if applicable
    - Your Obsidian version and OS

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
    - A clear, descriptive title
    - Detailed description of the feature
    - Use cases and benefits
    - Any mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature/fix:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Make your changes
4. Run tests and ensure code quality:
    ```bash
    npm run lint
    npm test
    ```
5. Commit your changes with clear commit messages
6. Push to your fork
7. Create a Pull Request

## Development Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start development mode:

    ```bash
    npm run dev
    ```

3. Link to your Obsidian vault:
    ```bash
    npm run link
    ```

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Keep functions small and focused
- Use meaningful variable and function names

### TypeScript Guidelines

- Use proper type annotations
- Avoid `any` type when possible
- Use interfaces for object shapes
- Use enums for fixed sets of values

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Follow the existing test patterns

## Release Process

1. Update version in `manifest.json`
2. Update `versions.json` for compatibility
3. Create a new release on GitHub
4. Update changelog

## Questions?

Feel free to:

- Open an issue
- Join our [Discord community](https://discord.gg/BkfD74mKcW)
- Contact the maintainers

Thank you for contributing to Sage AI! 🚀
