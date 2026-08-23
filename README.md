# DocuSense-AI
AI-powered Document Summary Assistant that extracts text from PDFs and images using OCR and generates concise, intelligent summaries with key points.
📚 Midnight Scholar
Document Summary Assistant

Midnight Scholar is a browser-based Document Summary Assistant that helps users quickly understand lengthy documents. It accepts PDF files and scanned images, extracts their text, and generates concise summaries along with important key takeaways.

The application is designed with a clean, responsive interface focused on making document reading faster and easier.

✨ Features
📄 PDF Upload — Upload PDF documents up to 10MB.
🖼️ Image Upload — Supports JPG and PNG scanned documents.
🔍 PDF Text Extraction — Extracts text from PDF pages using PDF.js.
👁️ OCR Support — Converts text from scanned images using Tesseract.js.
🧠 Smart Summarization — Generates summaries using extractive, word-frequency-based text analysis.
📊 Adjustable Summary Depth — Choose between:
Brief — Quick overview
Balanced — Main context and important information
Detailed — More comprehensive summary
🔑 Key Takeaways — Displays the most important sentences separately.
📋 Copy Summary — Copy the generated summary with one click.
💾 Download Summary — Save the generated summary as a .txt file.
🖱️ Drag & Drop — Upload documents using drag-and-drop or file selection.
⚠️ Error Handling — Handles unsupported files, oversized files, and unreadable documents.
⏳ Loading States — Shows document processing and OCR progress.
📱 Responsive Design — Works across desktop and mobile screen sizes.
🛠️ Technologies Used
Technology	Purpose
HTML5	Application structure
CSS3	Styling and responsive design
JavaScript	Application logic
PDF.js	PDF text extraction
Tesseract.js	OCR for scanned images
Font Awesome	Icons
Google Fonts	Typography
🔄 How It Works
        Upload Document
              ↓
       PDF or Image File
              ↓
      ┌───────┴────────┐
      ↓                ↓
   PDF.js          Tesseract.js
      ↓                ↓
      └───────┬────────┘
              ↓
        Extracted Text
              ↓
     Text Preprocessing
              ↓
    Word Frequency Analysis
              ↓
       Sentence Scoring
              ↓
     ┌────────┴─────────┐
     ↓                  ↓
   Summary        Key Takeaways
🧠 Summarization Approach

Midnight Scholar uses an extractive summarization approach.

The extracted document text is processed by:

Cleaning and normalizing the text.
Splitting the content into sentences.
Calculating word frequencies.
Removing common stop words.
Assigning scores to sentences based on word frequency.
Selecting the highest-scoring sentences.
Preserving their original order to create the final summary.
Selecting the top sentences separately as key takeaways.

The summary length changes depending on the selected option:

Brief: 3 sentences
Balanced: 5 sentences
Detailed: 9 sentences
🔐 Privacy

The application processes documents directly in the user's browser. According to the application's implementation, uploaded documents are not sent to a server.

PDF files are processed using PDF.js, while image files are processed using Tesseract.js OCR directly in the browser.

📁 Project Structure
Midnight-Scholar/
│
├── index.html
└── README.md

The current version is implemented as a single HTML file containing the application's HTML, CSS, and JavaScript.

🚀 Getting Started
1. Clone the repository
git clone https://github.com/YOUR-USERNAME/Midnight-Scholar.git
2. Open the project

Open index.html in a modern web browser.

You can also use VS Code Live Server for local development.

3. Upload a document

Upload a PDF, JPG, or PNG file.

4. Select summary depth

Choose:

Brief → Balanced → Detailed

5. Generate the summary

Click Generate Summary to extract the document text and generate the summary and key takeaways.

📌 File Requirements
Supported formats: PDF, JPG, JPEG, PNG
Maximum file size: 10 MB
Scanned images should be clear enough for OCR to recognize the text.
🎯 Project Objective

The main objective of Midnight Scholar is to reduce the time required to understand lengthy documents by automatically extracting their important information and presenting it in an easy-to-read format.

🌐 Deployment

Since Midnight Scholar is a client-side web application, it can be deployed using services such as:

GitHub Pages
Netlify
Vercel
🚧 Future Improvements
Add support for more languages in OCR.
Improve summarization using transformer-based NLP models.
Add document history.
Support multiple document uploads.
Add PDF summary export.
Add dark/light theme options.
Add keyword and topic extraction.
Support larger documents.
👩‍💻 Author

Your Name

B.Tech — Computer Science & Engineering
Artificial Intelligence & Machine Learning

⭐ If you find this project useful, consider giving the repository a star!
