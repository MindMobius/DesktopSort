# 桌面快捷方式 Web 应用

## 简介

这是一个使用 Python (Flask) 开发的 Web 应用，用于在网页上展示和打开 Windows 桌面上的快捷方式。

## 功能

*   **展示桌面快捷方式：**  在网页上列出桌面上的所有快捷方式。
*   **打开快捷方式：**  点击网页上的快捷方式，即可打开对应的应用程序。

## 技术栈

*   **后端：**
    *   Python 3
    *   Flask (Web 框架)
    *   `pywin32` (用于访问 Windows API)
    *   `winshell` (用于读取快捷方式信息)
*   **前端：**
    *   HTML
    *   JavaScript

## 依赖

*   Python 3
*   Flask
*   `pywin32`
*   `winshell`

## 安装

1.  **安装 Python 依赖：**

    ```bash
    pip install flask pywin32 winshell
    ```

## 使用方法

1.  **运行 `app.py`：**

    ```bash
    python app.py
    ```

2.  **在浏览器中打开 `http://127.0.0.1:5000/`。**

## 代码结构

*   `app.py`：Python 后端代码，包含 Flask 应用的路由和逻辑。
*   `templates/index.html`：HTML 前端代码，用于展示快捷方式列表。
