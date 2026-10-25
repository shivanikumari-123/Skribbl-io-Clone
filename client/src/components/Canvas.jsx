import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const Canvas = ({ isDrawer, canvasHistory = [] }) => {
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen'); 

  const lastPos = useRef({ x: 0, y: 0 });

  
  const drawLine = (start, end, drawColor, drawSize) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.stroke();
    ctx.closePath();
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (!socket) return;

    const handleDrawLine = (lineData) => {
      drawLine(lineData.start, lineData.end, lineData.color, lineData.size);
    };

    const handleClearCanvas = () => {
      clearCanvasLocal();
    };

    socket.on('draw_line', handleDrawLine);
    socket.on('clear_canvas', handleClearCanvas);

    return () => {
      socket.off('draw_line', handleDrawLine);
      socket.off('clear_canvas', handleClearCanvas);
    };
  }, [socket]);

  
  useEffect(() => {
    clearCanvasLocal();
    if (canvasHistory && canvasHistory.length > 0) {
      canvasHistory.forEach((line) => {
        drawLine(line.start, line.end, line.color, line.size);
      });
    }
  }, [canvasHistory]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    lastPos.current = getCanvasCoords(e);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer) return;
    const currentPos = getCanvasCoords(e);
    const activeColor = tool === 'eraser' ? '#1e293b' : color;
    const activeSize = tool === 'eraser' ? brushSize * 4 : brushSize;

    drawLine(lastPos.current, currentPos, activeColor, activeSize);

    if (socket) {
      socket.emit('draw_line', {
        start: lastPos.current,
        end: currentPos,
        color: activeColor,
        size: activeSize,
      });
    }

    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!isDrawer) return;
    clearCanvasLocal();
    if (socket) {
      socket.emit('clear_canvas');
    }
  };

  const colors = [
    '#ffffff', '#000000', '#ef4444', '#f97316', 
    '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'
  ];

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="relative w-full aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full touch-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}
        />
      </div>

      {isDrawer && (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full mt-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c && tool === 'pen' ? 'border-amber-400 scale-110 ring-2 ring-amber-400/50' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                tool === 'pen' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              ✏️ Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                tool === 'eraser' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              🧹 Eraser
            </button>
            <input
              type="range"
              min="2"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-amber-500"
            />
            <button
              onClick={handleClear}
              className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-sm font-semibold transition"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};