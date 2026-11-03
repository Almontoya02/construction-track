import { cn } from "@/lib/utils";
import * as React from "react";
import { useNavigation } from "react-router";

const LoadingProgress: React.FC = () => {
  const navigation = useNavigation();
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [complete, setComplete] = React.useState(false);

  React.useEffect(() => {
    if (navigation.state === "loading") {
      setProgress(0);
      setVisible(true);
      setComplete(false);
    } else if (navigation.state === "idle" && visible) {
      setComplete(true);
      const timeout = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [navigation.state, visible]);

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (visible && !complete) {
      intervalId = setInterval(() => {
        setProgress((prevProgress) => {
          // Ensure progress never reaches 100% until we're in idle state
          // Gradually slow down as it approaches 95%
          const increment = Math.max(0.5, (95 - prevProgress) * 0.05);
          const nextProgress = prevProgress + increment;
          return nextProgress > 95 ? 95 : nextProgress;
        });
      }, 100);
    } else if (complete) {
      setProgress(100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [visible, complete]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed top-0 left-0 w-full h-1 z-50 transition-opacity",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default LoadingProgress;
