import { useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { ScanQrCode } from "lucide-react";
import { relative } from "path";

type Props = {
  onScan: (value: string) => void;
};

export default function QrScanner({ onScan }: Props) {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const stopScanner = async () => {
    if (!qrRef.current) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch (e) {
      console.warn("Stop error:", e);
    } finally {
      qrRef.current = null;
      setIsRunning(false);
    }
  };

  const startScanner = async () => {
    if (isRunning) return;

    const qr = new Html5Qrcode("reader");
    qrRef.current = qr;

    try {
      await qr.start(
        { facingMode: "environment" },
        {
          fps: 5,
          qrbox: 200,
        },
        async (decodedText) => {
          // kirim hasil ke parent
          onScan(decodedText);

          // langsung hentikan scanner
          await stopScanner();
        },
        (error) => {
          // optional
          console.warn(error);
        },
      );

      setIsRunning(true);
    } catch (err) {
      console.error("Start gagal:", err);
    }
  };

  return (
    <div>
      <button onClick={startScanner} disabled={isRunning}>
        <ScanQrCode /> Scanner
      </button>

      <div id="reader" />
    </div>
  );
}
