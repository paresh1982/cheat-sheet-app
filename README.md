# 🤖 Analyst Copilot

**Analyst Copilot** is a high-performance, AI-powered cheat sheet application designed for data scientists and analysts. It provides instant access to syntax and examples for **PostgreSQL, Python, R, Excel, Power BI, Tableau, Bash, and Git**.

## 🚀 Key Features

-   **🔍 AI-Powered Search**: Instantly generate cheat sheet cards for any library or syntax using Gemini 1.5 Flash or Pro.
-   **🔄 Analyst Translator**: Convert code logic between languages (e.g., SQL to Pandas, Python to R) with "Ready-to-Run" examples.
-   **📋 Ready-to-Run Examples**: AI-generated examples include data setup (e.g., dummy DataFrames or built-in R datasets) so you can copy and paste directly into your IDE.
-   **⭐ Favorites & Persistence**: Pin your most-used formulas to the top. All AI-generated and favorited cards are saved to your browser's LocalStorage.
-   **🌓 Dark Mode**: Seamlessly toggle between light and dark themes for comfortable late-night analysis.
-   **📱 Modern Wide UI**: A slim, efficient sidebar and wide card layout optimized for readability.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **AI**: Google Gemini 1.5 Flash & Pro (via Gemini API)
-   **Styling**: Modern Vanilla CSS
-   **Storage**: Browser LocalStorage

## 🏁 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd cheat-sheet-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure API Key**:
    Create a `.env` file in the root directory and add your Gemini API Key:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```

## 🪄 Usage Tips

-   **Search Mode**: Use keywords like "ggplot2 bar chart", "pandas merge", or "sql window functions".
-   **Translator Mode**: Paste a complex SQL query and select "Python" as the active tool to see the equivalent Pandas code.
-   **Refine**: Use the Magic Wand (🪄) icon on any card to ask the AI to "make it more advanced" or "add more comments".

---
Built with ❤️ for Data Analysts.
