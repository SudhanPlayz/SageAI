# Sage AI - AI Assistant Plugin

Sage AI is a powerful plugin that brings advanced AI capabilities to your note-taking workflow. It offers intelligent text generation, summarization, and analysis features to enhance your productivity and creativity.

## Features

- 🤖 AI-powered text generation and completion
- 📝 Smart summarization of your notes
- 🔍 Intelligent analysis of your content
- 🎯 Context-aware suggestions
- ⚡ Seamless integration with your workflow

## Installation

### From Community Plugins

1. Open Settings
2. Go to Community Plugins
3. Search for "Sage AI"
4. Click Install
5. Enable the plugin

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/SudhanPlayz/SageAI/releases)
2. Extract the files into your plugins folder: `<vault>/.obsidian/plugins/sageai`
3. Reload the application
4. Enable the plugin in Settings > Community Plugins

## Usage

### Initial Setup

1. After installation, go to Settings > Community Plugins > Sage AI
2. Configure your preferred AI provider:
    - OpenRouter (default)
    - Google Gemini
    - Ollama (local)
3. Enter your API key (required for OpenRouter and Google Gemini)
4. Select your preferred model (e.g., gpt-4, gpt-4o-mini)
5. For Ollama users, configure the base URL (default: http://localhost:11434)

### Using Sage AI

[![Sage AI Usage Demo](https://m04c1c9vtp.ufs.sh/f/7CIKNs50xIfi5oXgoNSuISAvKfBUXT0EY1ZgQjs7FecMrwPx)](https://www.youtube.com/watch?v=9XEplIKSbLE)

#### Quick Access

- Click the sparkle icon (✨) in the ribbon to open the Sage AI interface
- The interface will appear in a new panel on the right side of your workspace

#### Tips for Best Results

- Be specific in your prompts and instructions
- Use the context-aware features by selecting relevant text before using commands
- The AI considers your current file, cursor position, and selected text for better results
- You can hide the AI's thought process in settings for a cleaner interface

### Advanced Features

- **Context Awareness**: Sage AI automatically considers your current file, cursor position, and selected text
- **Multiple AI Providers**: Switch between different AI providers based on your needs
- **Custom Models**: Use different models for different tasks
- **Local Processing**: Run AI locally using Ollama for privacy-sensitive tasks

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Git

### Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/SudhanPlayz/SageAI.git
    cd SageAI
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start development mode:
    ```bash
    npm run dev
    ```

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details.

## Support

- 🌟 Star the repository if you find it useful
- 💬 Join our [Discord community](https://discord.gg/BkfD74mKcW)
- 🐛 Report bugs on [GitHub Issues](https://github.com/SudhanPlayz/SageAI/issues)
- 💖 Support the project on [GitHub Sponsors](https://github.com/sponsors/SudhanPlayz)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Obsidian team for their amazing platform
- All our contributors and supporters
- The open-source community
