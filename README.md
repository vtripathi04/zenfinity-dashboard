# ⚡ Zenfinity Energy Dashboard

A comprehensive battery analytics dashboard built for the Zenfinity Energy Frontend Internship assessment. This application visualizes complex telemetry data from Li-ion battery cycles, offering insights into State of Health (SOH), charging habits, and operational stress.

## 🚀 Features

### Core Dashboard
* **Cycle Navigation:** Seamlessly browse through battery charge/discharge cycles with a responsive stepper and dropdown selector.
* **Key Metrics:** Instant view of Average SOC, SOH Drop, Duration, and Total Distance per cycle.
* **Safety Logs:** Real-time visualization of warnings and protection events triggered during operation.
* **Thermal Analysis:** Interactive histogram showing time spent in specific temperature ranges (with configurable 5°C/10°C/15°C/20°C bins).

### 📈 Advanced Analytics (Bonus)
* **Long-term Trends:** A dedicated analysis page visualizing SOH degradation and SOC patterns across the entire lifespan of the battery.
* **Voltage Swing Monitor:** Tracks the delta between Max and Min pack voltages to identify deep discharge usage patterns.
* **Operational Stress Plot:** Scatter plot correlating Average Speed vs. Temperature to detect thermal management efficiency.
* **Efficiency Metric:** Calculates `km / %SOC` to measure vehicle energy efficiency.

### 🛠️ Utilities
* **PDF Export:** Download high-resolution, vector-quality PDF reports of the dashboard for offline analysis.
* **JSON Export:** Download raw telemetry data for specific cycles.
* **Responsive Design:** Fully responsive layout optimized for desktop and tablet analysis.

## 🛠️ Tech Stack

* **Framework:** React 18 + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS v4 (Alpha)
* **Charts:** Recharts
* **Icons:** Lucide React
* **Data Export:** html-to-image, jsPDF
* **HTTP Client:** Axios

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn

### Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/zenfinity-dashboard.git
    cd zenfinity-dashboard
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open the dashboard**
    Navigate to `http://localhost:5173` in your browser.

## 📂 Project Structure

```bash
src/
├── components/       # Reusable UI widgets (Layout, Charts, Cards)
├── pages/            # Main views (Dashboard, Trends)
├── services/         # API integration & error handling
├── types/            # TypeScript interfaces matching API specs
└── index.css         # Tailwind v4 theme configuration
```

## 🌍 Deployment

This project is configured for deployment on **Vercel**.

* A `vercel.json` file is included to handle API proxying, resolving CORS issues by rewriting requests to the Zenfinity backend.
* To deploy, simply import your repository into Vercel. The configuration will be detected automatically.

## 💡 Implementation Notes

* **Data Handling:** The dashboard robustly handles missing cycles or API gaps by checking the `last_cycle` summary before navigation.
* **Voltage Analysis:** Instead of standard cell imbalance (mV), the dashboard monitors **Pack Voltage Swing (V)** to reflect the available telemetry data (Pack Max/Min).
* **SOH Calculation:** State of Health is derived cumulatively from the `soh_drop` metric provided by the API.

---

**Author:** Vishwajeet Tripathi

**Submission for:** Zenfinity Energy Frontend Intern Assignment