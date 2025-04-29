# Saruta

**Saruta** is a RESTful system for creating media metadata from media files with no existing metadata.

## Features

- REST API for media metadata creation and validation
- Staging, production, and rejection pipelines for file management
- Automated database indexing and cleanup for media files
- Configurable directory and database setup
- Logging, error handling, and operational feedback

## Installation

```bash
git clone https://github.com/coreyMerritt/saruta.git
cd saruta
npm install
```

## Usage

To start the system:

```bash
npm run start
```

You can interact with the REST API to trigger operations like:

- Submitting media for validation
- Moving files through staging, production, and rejection
- Managing and backing up metadata databases
- Linting metadata to remove invalid entries

## Configuration

Key configurations for:

- Directories (staging, production, backup, etc.)
- Database connections and table names
- Operational settings for file handling and validation

are located inside the `src/configuration` directory and can be customized as needed.

## License

Distributed under the [MIT License](LICENSE).

---

*Note: Saruta is under active development and structure may evolve over time.*

