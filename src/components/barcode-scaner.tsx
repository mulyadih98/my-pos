"use client";

import { useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";

export default function BarcodeScanner() {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment", // kamera belakang
          },
        },
        decoder: {
          readers: ["ean_reader"], // penting untuk EAN-13
        },
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      },
    );

    Quagga.onDetected((data) => {
      console.log("Barcode:", data.codeResult.code);
    });

    return () => {
      Quagga.stop();
    };
  }, []);

  return (
    <div>
      <div ref={scannerRef} style={{ width: "100%" }} />
    </div>
  );
}
