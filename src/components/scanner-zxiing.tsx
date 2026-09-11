import { useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type Props = {
  onScan: (value: string) => void;
};

export default function BarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const scannedRef = useRef(false); // cegah double scan

  const startScanner = async () => {
    if (isRunning) return;

    const reader = new BrowserMultiFormatReader();
    scannedRef.current = false;

    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!devices.length) {
        throw new Error("Camera tidak ditemukan");
      }

      // pilih kamera belakang kalau ada
      const backCamera = devices.find((d) =>
        d.label.toLowerCase().includes("back"),
      );

      const deviceId = backCamera?.deviceId || devices[0].deviceId;

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, error) => {
          if (result && !scannedRef.current) {
            scannedRef.current = true;

            const text = result.getText();
            onScan(text);

            // auto stop setelah berhasil scan
            stopScanner();
          }

          if (error && error.name !== "NotFoundException") {
            console.error(error);
          }
        },
      );

      controlsRef.current = controls;
      setIsRunning(true);
    } catch (err) {
      console.error("Gagal start scanner:", err);
    }
  };

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsRunning(false);
  };

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            border: "1px solid #ccc",
          }}
        />

        {/* Overlay scan box */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "80%",
            height: "60%",
            border: "2px solid white",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={startScanner} disabled={isRunning}>
          Start
        </button>

        <button onClick={stopScanner} disabled={!isRunning}>
          Stop
        </button>
      </div>
    </div>
  );
}
