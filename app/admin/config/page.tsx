"use client";
import React, { useEffect, useState } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { uploadImageAndGetUrl } from "../../lib/upload-image";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function ConfigPage() {
  const colors = {
    bg: "#f8fafc",
    cardBg: "#ffffff",
    accent: "#E0A11A",
    text: "#0f172a",
    border: "#e2e8f0",
  };

  return (
    <div className="px-6 py-6 sm:py-12 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Tema fijo</h2>
        <p className="text-sm text-slate-600 mb-4">
          El sitio usa una sola paleta visual y no permite alternar entre claro y oscuro.
        </p>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.bg, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Fondo</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.cardBg, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Tarjeta</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.accent, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Acento</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded shadow" style={{ background: colors.text, border: `2px solid ${colors.border}` }} />
            <span className="text-xs mt-1">Texto</span>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-2">Marca de agua</h2>
        <WatermarkSettings />
      </div>

      {/* Cambiar contraseña */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-2">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function WatermarkSettings() {
  const { settings } = useSiteSettings();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSave = async () => {
    setMessage("");
    if (!file) {
      setMessage("Selecciona un archivo PNG primero.");
      return;
    }

    const isPng =
      file.type === "image/png" ||
      file.name.toLowerCase().endsWith(".png");

    if (!isPng) {
      setMessage("La marca de agua debe ser un archivo PNG.");
      return;
    }

    setLoading(true);
    try {
      const path = `landing_page/watermark/watermark_${Date.now()}.png`;
      const url = await uploadImageAndGetUrl(file, path);
      await setDoc(
        doc(db, "landingPage", "main"),
        { productWatermarkUrl: url },
        { merge: true }
      );
      setMessage("Marca de agua guardada correctamente.");
      setFile(null);
    } catch (e: any) {
      setMessage("Error: " + (e?.message || "No se pudo guardar la marca de agua"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setMessage("");
    setLoading(true);
    try {
      await setDoc(
        doc(db, "landingPage", "main"),
        { productWatermarkUrl: null },
        { merge: true }
      );
      setMessage("Marca de agua eliminada.");
    } catch (e: any) {
      setMessage("Error: " + (e?.message || "No se pudo eliminar la marca de agua"));
    } finally {
      setLoading(false);
    }
  };

  const currentUrl = settings.productWatermarkUrl;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Sube un PNG con fondo transparente. Se mostrará abajo a la derecha en las imágenes de productos donde esté activada.
      </p>

      {currentUrl && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-600 mb-2">Actual</div>
          <div className="relative w-44 h-44 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
            <img src={currentUrl} alt="Marca de agua" className="w-full h-full object-contain p-3" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-2">Subir PNG</span>
          <input
            type="file"
            accept="image/png"
            disabled={loading}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-4 file:py-2 file:text-white file:font-semibold disabled:opacity-60"
          />
        </label>

        {previewUrl && (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold text-slate-600 mb-2">Vista previa</div>
            <div className="relative w-44 h-44 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
              <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain p-3" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !file}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar marca de agua"}
          </button>

          <button
            type="button"
            onClick={handleRemove}
            disabled={loading || !currentUrl}
            className="bg-white text-slate-800 px-4 py-2 rounded-xl font-semibold border border-slate-200 disabled:opacity-60"
          >
            Quitar marca de agua
          </button>
        </div>

        {message && (
          <div className={`text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para cambiar contraseña
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Por favor completa todos los campos.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Usuario no autenticado");
      // Reautenticación
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Cambiar contraseña
      await updatePassword(user, newPassword);
      setMessage("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setMessage("Error: " + (e.message || "No se pudo cambiar la contraseña"));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Contraseña actual</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Cambiando..." : "Cambiar contraseña"}
      </button>
      {message && (
        <div className={`mt-2 text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>{message}</div>
      )}
    </form>
  );
}

