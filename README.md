# Desktop Shortcuts Web Launcher

## 简介

**Desktop Shortcuts Web Launcher** is an enhanced Python (Flask) web application that provides a modern, user-friendly interface to display, categorize, search, and launch your Windows desktop shortcuts directly from a web browser. It intelligently extracts shortcut icons, classifies applications, and offers a responsive design for easy access on various devices.

This application is designed for local use on a Windows machine where the desktop shortcuts reside.

## Features

*   **Display Desktop Shortcuts:** Lists all valid shortcuts from your Windows desktop.
*   **Launch Applications:** Click any shortcut in the web interface to open the corresponding application on your machine.
*   **Icon Extraction & Display:** Automatically extracts and displays the actual icon for each shortcut. A default placeholder icon is shown if an icon cannot be retrieved.
*   **AI-Powered Categorization:** Shortcuts are intelligently classified into categories (e.g., "Productivity," "Development," "Web Browsers," "Games") based on keywords found in their name, path, and description. Uncategorized items fall into an "Other" category.
*   **Live Search/Filter:** Instantly search and filter shortcuts by name, path, description, or category directly from the web interface.
*   **Detailed Information:** Displays the shortcut's name, target path, command-line arguments, and description.
*   **Modern & Responsive UI:** Features a clean, updated user interface with improved layout, fonts, and colors, ensuring good usability across different screen sizes.
*   **Enhanced Launch Feedback:** Provides clear, non-intrusive status messages (success or error) when attempting to launch an application.

## Technology Stack

*   **Backend:**
    *   Python 3
    *   Flask (Web Framework)
    *   `winshell` (for reading shortcut information)
    *   `pywin32` (for accessing Windows API, especially for icon extraction)
    *   `Pillow` (Python Imaging Library - for processing extracted icons)
*   **Frontend:**
    *   HTML5
    *   CSS3
    *   Vanilla JavaScript (for search and dynamic interactions)

## Dependencies

*   Python 3
*   Flask
*   `winshell`
*   `pywin32`
*   `Pillow`

## Installation

1.  **Prerequisites:**
    *   Ensure you have Python 3 installed on your Windows machine.
    *   It's recommended to use a virtual environment for Python projects.

2.  **Install Python Dependencies:**
    Open a command prompt or PowerShell and run:
    ```bash
    pip install flask winshell pywin32 Pillow
    ```

## Usage

1.  **Run the Application:**
    Navigate to the project directory in your command prompt or PowerShell and execute:
    ```bash
    python app.py
    ```

2.  **Access in Browser:**
    Open your web browser and go to `http://127.0.0.1:5000/`.

3.  **Using the Features:**
    *   **Browse:** Shortcuts are listed, grouped by their automatically assigned category.
    *   **Launch:** Click on a shortcut's name to launch it. You'll see a status message at the top indicating success or failure.
    *   **Search:** Use the search bar at the top to type keywords. The list will update dynamically to show matching shortcuts based on their name, path, description, or category.
    *   **View Details:** Each shortcut entry displays its icon, name, target path, arguments (if any), and description.

## Code Structure

*   `app.py`: The main Python Flask application file. It handles shortcut discovery, icon extraction, classification, and serves the web interface.
*   `templates/index.html`: The single HTML file that renders the web interface using Jinja templating. It includes all necessary CSS and JavaScript for the frontend.

## Screenshots

*[Consider adding a screenshot of the new UI here to showcase the categorized view, icons, and search bar.]*

## Future Enhancements (Ideas)

*   Customizable categories.
*   Drag-and-drop reordering.
*   User authentication for remote access (with security considerations).

## Contributing

Contributions, issues, and feature requests are welcome! Please feel free to fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if one exists, otherwise specify).
---

This README aims to be a comprehensive guide for users and developers interacting with the application.
