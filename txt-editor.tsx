// src/App.tsx

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'; // <-- ВОТ ЗДЕСЬ! 'invoke' импортируется из '@tauri-apps/api/tauri'
import { open as openDialog, save as saveDialog } from '@tauri-apps/api/dialog';
import { Window } from '@tauri-apps/api/window'; // <-- А 'appWindow' импортируется из '@tauri-apps/api/window'

import './styles.css'; // Добавляем CSS файл

function App() {
  const [text, setText] = useState<string>('');
  const [filePath, setFilePath] = useState<string | null>(null);

  // Обновление заголовка окна при изменении filePath
  useEffect(() => {
    if (filePath) {
      const fileName = filePath.split(/[\\/]/).pop(); // Извлекаем имя файла из пути
      Window.setTitle(`Редактор - ${fileName}`);
    } else {
      Window.setTitle('Редактор - Новый файл');
    }
  }, [filePath]);

  // Обработчик открытия файла
  const handleOpenFile = async () => {
    try {
      // Вызываем команду open_file из Rust
      const [content, path] = await invoke<[string, string]>('open_file');
      setText(content);
      setFilePath(path);
      alert(`Файл открыт: ${path}`);
    } catch (error) {
      alert(`Ошибка при открытии файла: ${error}`);
    }
  };

  // Обработчик сохранения файла
  const handleSaveFile = async () => {
    try {
      let currentPath = filePath;

      // Если файл еще не был сохранен или открыт, вызываем диалог "Сохранить как"
      if (!currentPath) {
        const selectedPath = await saveDialog({
          filters: [{ name: 'Text Files', extensions: ['txt', 'md', 'log', 'json', 'toml'] }, { name: 'All Files', extensions: ['*'] }]
        });
        if (selectedPath) {
          currentPath = selectedPath.toString();
        } else {
          alert('Сохранение отменено.');
          return; // Пользователь отменил сохранение
        }
      }

      // Вызываем команду save_file из Rust
      const newPath = await invoke<string>('save_file', { content: text, path: currentPath });
      setFilePath(newPath); // Обновляем путь на случай, если это было "Сохранить как"
      alert(`Файл сохранен: ${newPath}`);
    } catch (error) {
      alert(`Ошибка при сохранении файла: ${error}`);
    }
  };

  // Обработчик "Сохранить как..."
  const handleSaveFileAs = async () => {
    try {
      const selectedPath = await saveDialog({
        filters: [{ name: 'Text Files', extensions: ['txt', 'md', 'log', 'json', 'toml'] }, { name: 'All Files', extensions: ['*'] }]
      });

      if (selectedPath) {
        const newPath = await invoke<string>('save_file', { content: text, path: selectedPath.toString() });
        setFilePath(newPath);
        alert(`Файл сохранен как: ${newPath}`);
      } else {
        alert('Сохранение как... отменено.');
      }
    } catch (error) {
      alert(`Ошибка при сохранении файла как...: ${error}`);
    }
  };

  // Ctrl+A, C, V, X, Z, Y
  // Эти комбинации клавиш работают "из коробки" для textarea в браузере.
  // Нам не нужно писать специальный код для их обработки, если мы не хотим
  // реализовывать свою собственную логику для буфера обмена или истории отмен.
  // Просто убедитесь, что они не блокируются.

  return (
    <div className="container">
      <h1>Простой Текстовый Редактор</h1>
      <div className="controls">
        <button onClick={handleOpenFile}>Открыть файл</button>
        <button onClick={handleSaveFile}>Сохранить</button>
        <button onClick={handleSaveFileAs}>Сохранить как...</button>
      </div>
      <textarea
        className="text-editor"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Начните вводить текст здесь..."
        rows={20} // Вы можете настроить размер
        cols={80} // или использовать CSS
      ></textarea>
    </div>
  );
}

export default App;