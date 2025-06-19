# Mohammad Mainul Hasan - Evaluating Storage Solutions for Multimedia-Intensive Survey Frameworks

Open Research Artifacts for Master Thesis: "Evaluating Storage Solutions for Multimedia-Intensive Survey Frameworks" 
by *Mohammad Mainul Hasan* (University of Oslo, 2025)

**Abstract:** The growing use of multimedia-intensive applications, especially in interactive surveys, requires a rigorous evaluation of cloud-based and client-side storage solutions to optimize their performance, scalability, and cost-effectiveness. This thesis benchmarks seven widely-used multimedia storage solutions, AWS S3, Azure Blob Storage, Firebase, Dropbox, OneDrive, Google Drive, and Local Storage, within Huldra, a React-based multimedia survey framework.

Empirical assessments evaluated multimedia retrieval performance (fetch-time), network efficiency (throughput, HTTP overhead), and token management complexity across varied multimedia types, file sizes, network conditions, and geographical locations. The results highlight superior performance from Local Storage, AWS S3, and Azure Blob Storage, identifying these as optimal for latency-sensitive multimedia applications. Dropbox, OneDrive, and Google Drive showed performance limitations under constrained conditions, recommending cautious deployment.

The research identified significant trade-offs in token management strategies affecting usability, reliability, and security. Firebase simplified user experience through long-lived tokens but posed moderate security risks. Short-lived tokens used by Dropbox and OneDrive introduced complexity and potential disruptions, while Google Drive’s token management depended significantly on verification status, impacting operational reliability.

Methodologically, this research provides reproducible benchmarking frameworks, comprehensive JavaScript-based testing scripts, and open-source integration libraries. It offers scenario-specific guidance for high-performance, cost-effective, and secure multimedia survey implementations. This thesis contributes valuable insights and tools for informed decision-making and optimized deployment in multimedia-rich survey contexts.

## 📘 Overview
This repository contains the complete set of open research artifacts supporting the above-mentioned master's thesis. It focuses on evaluating the **performance, network efficiency, and token management complexity** of multiple cloud-based and local storage providers within **Huldra**, a React-based multimedia survey framework.

## 🧪 Research Goals
The study answers the following research questions:
- **RQ1**: Fetch-time performance for multimedia assets (video, audio, image, text)
- **RQ2**: Network efficiency (throughput, HTTP header overhead)
- **RQ3**: Token management complexity (usability, security, reliability)

## 📦 Repository Structure
```bash
.
├── code/                   # Frontend benchmarking scripts (React + JS)
├── datasets/              # Raw and processed CSV files of metrics
├── figures/               # Resulting visualizations, architecture diagram, flowchart used in the thesis
├── LICENSE                # Open-source license (MIT or CC BY 4.0)
└── README.md              # This file
```

## 🔍 Evaluated Storage Providers
- 📦 **Firebase Storage**
- ☁️ **AWS S3**
- ☁️ **Azure Blob Storage**
- 📁 **Dropbox**
- 📁 **OneDrive**
- 📁 **Google Drive**
- 💻 **Local Storage** (client-side, browser-based)

## ⚙️ How to Reproduce
1. Clone this repo
   ```bash
   git clone https://github.com/simula/huldra-students/tree/main/mohammad-mainul-hasan.git
   cd mohammad-mainul-hasan
   ```
2. Setup Huldra + your preferred cloud storage SDK credentials
3. Run benchmarking via local server (e.g., `vite`, `webpack`, or `react-scripts`)
4. Results will auto-log to `datasets/`

## 📊 Key Metrics Captured
- Fetch-time (ms)
- Throughput (KB/s)
- HTTP header overhead (Bytes)
- Token type, expiry policy, refresh complexity

## 📄 Citation
If you use this repository, please cite the thesis:
```bibtex
@mastersthesis{hasan2025huldra,
  title={Evaluating Storage Solutions for Multimedia-Intensive Survey Frameworks},
  author={Hasan, Mohammad Mainul},
  school={University of Oslo},
  year={2025},
  note={Open Research Artifacts available at https://github.com/simula/huldra-students/tree/main/mohammad-mainul-hasan}
}
```

## 📬 Contact
For questions or collaborations:
- 📧 moh.mainul.hasan [at] gmail [dot] com
- 🌐 [WebDevStory](https://webdevstory.com)

---
© 2025 Mohammad Mainul Hasan. Openly licensed under MIT / CC BY 4.0.
