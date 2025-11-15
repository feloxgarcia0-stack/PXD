import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Copy, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Check,
  Loader2,
  ChevronRight,
  FileDown
} from 'lucide-react';
import { NoteImage, AppState } from './types';
import { transcribeNotes } from './services/gemini';
import ImagePreview from './components/MessageBubble';

const MIN_IMAGES = 3;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Upload);
  const [images, setImages] = useState<NoteImage[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: NoteImage[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = URL.createObjectURL(file);
        const base64 = await readFileAsBase64(file);
        
        newImages.push({
          id: Date.now() + i + Math.random().toString(),
          file,
          url,
          base64
        });
      }
      
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleTranscribe = async () => {
    if (images.length < MIN_IMAGES) {
      setError(`Por favor sube al menos ${MIN_IMAGES} fotos para asegurar la precisión.`);
      return;
    }

    setAppState(AppState.Processing);
    try {
      const base64Array = images.map(img => img.base64);
      const text = await transcribeNotes(base64Array);
      setTranscription(text);
      setAppState(AppState.Result);
    } catch (err) {
      setAppState(AppState.Error);
      setError("Hubo un error procesando tus apuntes. Intenta nuevamente con fotos más claras.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    alert('¡Texto copiado al portapapeles!');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Apuntes-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReset = () => {
    setImages([]);
    setTranscription('');
    setAppState(AppState.Upload);
    setError(null);
  };

  // UI: Upload Screen
  if (appState === AppState.Upload || appState === AppState.Processing || appState === AppState.Error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 no-print">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="text-white w-5 h-5" />
              </div>
              <h1 className="font-bold text-gray-800 text-lg">Transcriptor de Apuntes</h1>
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              Gemini 2.5 Vision
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full p-4 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sube tus apuntes</h2>
            <p className="text-gray-500 mb-6">
              Toma fotos de tus cuadernos (cursiva o molde). Nuestro sistema unificará la información.
            </p>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3 mb-6">
              <AlertTriangle className="text-blue-500 w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 text-sm">Requisito de Calidad</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Necesitas subir al menos <strong>3 fotos</strong> del mismo apunte. Mientras más fotos subas (diferentes ángulos o secciones), menor será el margen de error.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div 
              onClick={() => appState !== AppState.Processing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                appState === AppState.Processing 
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                  : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400'
              }`}
            >
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
                disabled={appState === AppState.Processing}
              />
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Camera className="w-8 h-8 text-indigo-600" />
              </div>
              <span className="font-medium text-indigo-900">Toca para tomar fotos o subir archivos</span>
              <span className="text-sm text-gray-400 mt-1">Soporta JPG, PNG</span>
            </div>
          </div>

          {/* Gallery Grid */}
          {images.length > 0 && (
            <div className="mb-24">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Fotos seleccionadas ({images.length})</h3>
                {images.length < MIN_IMAGES && (
                  <span className="text-xs text-orange-500 font-medium">
                    Faltan {MIN_IMAGES - images.length} para continuar
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map(img => (
                  <ImagePreview 
                    key={img.id} 
                    image={img} 
                    onRemove={appState === AppState.Processing ? () => {} : handleRemoveImage} 
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center animate-pulse">
              {error}
            </div>
          )}
        </main>

        {/* Fixed Bottom Action Bar */}
        <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0 z-20 no-print">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleTranscribe}
              disabled={images.length < MIN_IMAGES || appState === AppState.Processing}
              className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 transition-all shadow-lg ${
                images.length < MIN_IMAGES || appState === AppState.Processing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {appState === AppState.Processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando imágenes...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Transcribir Apuntes ({images.length})</span>
                </>
              )}
            </button>
            {images.length > 0 && images.length < MIN_IMAGES && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Recuerda: Mínimo 3 fotos requeridas
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // UI: Result Screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Non-printable Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={handleReset}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Nuevo Escaneo</span>
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={handleCopy}
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors hidden sm:flex"
              title="Copiar al portapapeles"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </button>
            <button 
              onClick={handleDownloadTxt}
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              title="Descargar como archivo de texto"
            >
              <FileDown className="w-4 h-4 mr-2" />
              TXT
            </button>
            <button 
              onClick={handlePrintPDF}
              className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              title="Guardar como PDF"
            >
              <Download className="w-4 h-4 mr-2" />
              Guardar PDF
            </button>
          </div>
        </div>
      </header>

      {/* Printable Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="printable-container max-w-4xl mx-auto bg-white shadow-lg rounded-xl min-h-[80vh] p-8 sm:p-12">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Transcripción de Apuntes</h1>
            <p className="text-sm text-gray-400 flex items-center">
              <Check className="w-4 h-4 mr-1 text-green-500" />
              Generado el {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Área de texto */}
          <div className="prose prose-indigo max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-lg">
              {transcription}
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-gray-100 text-center no-print">
             <p className="text-xs text-gray-400">
               Revisa el texto por posibles errores de interpretación de caligrafía.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;