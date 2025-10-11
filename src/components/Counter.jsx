import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
export default function Counter({ remaining, total }) {
  const value = total > 0 ? (remaining / total) * 100 : 0;
  return (
    <div className="w-10 h-10">
      <CircularProgressbar value={value} text={String(remaining)} styles={buildStyles({ textSize: "34px" })} />
    </div>
  );
}
