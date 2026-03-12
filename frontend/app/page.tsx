import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Scan line effect */}
      <div className={styles.scanline} />

      {/* Main content */}
      <div className={styles.content}>
        {/* Logo mark */}
        <div className={styles.logoMark}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4L6 14V34L24 44L42 34V14L24 4Z"
              stroke="var(--cyan)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M24 12L14 18V30L24 36L34 30V18L24 12Z"
              stroke="var(--cyan)"
              strokeWidth="1"
              fill="var(--cyan-muted)"
            />
            <circle cx="24" cy="24" r="4" fill="var(--cyan)" />
          </svg>
        </div>

        {/* Title */}
        <h1 className={styles.title}>
          THREAT<span className={styles.titleAccent}>MATRIX</span>
        </h1>
        <p className={styles.subtitle}>COMMAND CENTER</p>

        {/* Status line */}
        <div className={styles.statusLine}>
          <span className="status-dot status-dot--live" />
          <span className={styles.statusText}>SYSTEM INITIALIZING</span>
        </div>

        {/* System info */}
        <div className={styles.systemInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>VERSION</span>
            <span className={styles.infoValue}>0.1.0</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ENGINE</span>
            <span className={styles.infoValue}>NEXT.JS 16.1.6</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>STATUS</span>
            <span className={styles.infoValue}>SCAFFOLD COMPLETE</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>PHASE</span>
            <span className={styles.infoValue}>WEEK 1 — FOUNDATION</span>
          </div>
        </div>

        {/* Temporarily added: Navigation to War Room */}
        <Link href="/war-room" className={styles.ctaButton}>
          <span>ENTER COMMAND CENTER</span>
          <span className={styles.btnIcon}>→</span>
        </Link>

        {/* Decorative grid corners */}
        <div className={styles.cornerTL} />
        <div className={styles.cornerBR} />
      </div>
    </div>
  );
}
