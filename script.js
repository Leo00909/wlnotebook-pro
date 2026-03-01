// 记事本管理系统 Pro版本
class NoteManager {
  constructor() {
    this.notes = [];
    this.currentNoteId = null;
    this.unsavedChanges = false;
    this.saveTimeout = null;
    this.init();
  }

  init() {
    this.loadNotes();
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    // 新建笔记
    document.getElementById("newNoteBtn").addEventListener("click", () => {
      this.createNote();
    });

    // 删除笔记
    document.getElementById("deleteNoteBtn").addEventListener("click", () => {
      if (this.currentNoteId !== null) {
        this.deleteNote(this.currentNoteId);
      }
    });

    // 导出TXT
    document.getElementById("exportTxtBtn").addEventListener("click", () => {
      this.exportAsTxt();
    });

    // 导出JSON
    document.getElementById("exportJsonBtn").addEventListener("click", () => {
      this.exportAsJson();
    });

    // 导入
    document.getElementById("importBtn").addEventListener("click", () => {
      document.getElementById("importFile").click();
    });

    document.getElementById("importFile").addEventListener("change", (e) => {
      this.importNotes(e.target.files[0]);
    });

    // 搜索
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.filterNotes(e.target.value);
    });

    // 编辑器事件
    document.getElementById("noteTitle").addEventListener("input", (e) => {
      this.updateCurrentNote({ title: e.target.value });
      this.markUnsaved();
    });

    document.getElementById("noteContent").addEventListener("input", (e) => {
      this.updateCurrentNote({ content: e.target.value });
      this.updateCharCount();
      this.markUnsaved();
    });

    // 格式化按钮
    document.getElementById("boldBtn").addEventListener("click", () => {
      this.insertFormatting("**", "**");
    });

    document.getElementById("italicBtn").addEventListener("click", () => {
      this.insertFormatting("*", "*");
    });

    document.getElementById("underlineBtn").addEventListener("click", () => {
      this.insertFormatting("__", "__");
    });

    document.getElementById("codeBtn").addEventListener("click", () => {
      this.insertFormatting("`", "`");
    });

    document.getElementById("quoteBtn").addEventListener("click", () => {
      this.insertFormatting("> ", "");
    });

    document.getElementById("h1Btn").addEventListener("click", () => {
      this.insertFormatting("# ", "");
    });

    document
      .getElementById("clearFormattingBtn")
      .addEventListener("click", () => {
        this.clearFormatting();
      });

    document.getElementById("wordCountBtn").addEventListener("click", () => {
      this.showWordCount();
    });

    // 标签
    document.getElementById("tagsInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addTagsFromInput();
      }
    });

    // 颜色选择
    document.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", () => {
        const color = option.dataset.color;
        this.updateCurrentNote({ color });
        this.updateColorPicker();
      });
    });

    // 自动保存
    setInterval(() => {
      if (this.unsavedChanges) {
        this.saveNotes();
        this.updateSaveStatus("已保存", true);
      }
    }, 3000);
  }

  createNote() {
    const note = {
      id: Date.now(),
      title: "未命名笔记 " + (this.notes.length + 1),
      content: "",
      tags: [],
      color: "white",
      createdTime: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      modifiedTime: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    this.notes.unshift(note);
    this.currentNoteId = note.id;
    this.saveNotes();
    this.render();
    this.selectNote(note.id);
    this.showToast("已新建笔记", "success");
    document.getElementById("noteTitle").focus();
    document.getElementById("noteTitle").select();
  }

  deleteNote(id) {
    const note = this.notes.find((n) => n.id === id);
    if (confirm(`确定要删除笔记 "${note.title}" 吗？删除后无法恢复。`)) {
      this.notes = this.notes.filter((note) => note.id !== id);
      this.currentNoteId = this.notes.length > 0 ? this.notes[0].id : null;
      this.saveNotes();
      this.render();
      if (this.currentNoteId) {
        this.selectNote(this.currentNoteId);
      } else {
        document.getElementById("emptyState").style.display = "flex";
        document.getElementById("editorContainer").style.display = "none";
      }
      this.showToast("笔记已删除", "info");
    }
  }

  selectNote(id) {
    this.currentNoteId = id;
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      document.getElementById("noteTitle").value = note.title;
      document.getElementById("noteContent").value = note.content;
      document.getElementById("createdTime").textContent =
        "创建: " + note.createdTime;
      document.getElementById("modifiedTime").textContent =
        "修改: " + note.modifiedTime;

      this.renderTags(note.tags);
      this.updateColorPicker();

      document.getElementById("emptyState").style.display = "none";
      document.getElementById("editorContainer").style.display = "flex";

      this.updateCharCount();
      this.render();
      this.unsavedChanges = false;
      this.updateSaveStatus("已保存", true);
    }
  }

  updateCurrentNote(updates) {
    if (this.currentNoteId === null) return;

    const note = this.notes.find((n) => n.id === this.currentNoteId);
    if (note) {
      Object.assign(note, updates);
      note.modifiedTime = new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      document.getElementById("modifiedTime").textContent =
        "修改: " + note.modifiedTime;
    }
  }

  markUnsaved() {
    this.unsavedChanges = true;
    this.updateSaveStatus("保存中...", false);
  }

  updateSaveStatus(text, isSuccess) {
    const statusEl = document.getElementById("saveStatus");
    const dot = statusEl.querySelector(".status-dot");
    const textEl = statusEl.querySelector(".status-text");

    textEl.textContent = text;
    if (isSuccess) {
      dot.style.background = "#51cf66";
    } else {
      dot.style.background = "#ff922b";
    }
  }

  updateCharCount() {
    const content = document.getElementById("noteContent").value;
    const lines = content.split("\n").length;
    document.getElementById("charCount").textContent = content.length;
    document.getElementById("noteCount").textContent = this.notes.length;
  }

  insertFormatting(before, after) {
    const textarea = document.getElementById("noteContent");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || "文本";

    const newText =
      text.substring(0, start) +
      before +
      selectedText +
      after +
      text.substring(end);
    textarea.value = newText;

    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selectedText.length;

    this.updateCurrentNote({ content: newText });
    this.markUnsaved();
  }

  clearFormatting() {
    const textarea = document.getElementById("noteContent");
    const text = textarea.value;
    const cleaned = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^> /gm, "")
      .replace(/^# /gm, "");

    textarea.value = cleaned;
    this.updateCurrentNote({ content: cleaned });
    this.markUnsaved();
    this.showToast("格式已清除", "info");
  }

  showWordCount() {
    const textarea = document.getElementById("noteContent");
    const content = textarea.value;
    const chars = content.length;
    const words = content.split(/\s+/).filter((w) => w.length > 0).length;
    const lines = content.split("\n").length;

    alert(`字数统计\n\n字符数: ${chars}\n单词数: ${words}\n行数: ${lines}`);
  }

  addTagsFromInput() {
    const input = document.getElementById("tagsInput");
    const tagsText = input.value.trim();
    if (!tagsText) return;

    const newTags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && tag.length > 0);

    const note = this.notes.find((n) => n.id === this.currentNoteId);
    if (note) {
      note.tags = [...new Set([...note.tags, ...newTags])];
      this.updateCurrentNote({ tags: note.tags });
      input.value = "";
      this.renderTags(note.tags);
      this.markUnsaved();
      this.showToast(`已添加 ${newTags.length} 个标签`, "success");
    }
  }

  renderTags(tags) {
    const tagsList = document.getElementById("tagsList");
    tagsList.innerHTML = tags
      .map(
        (tag) => `
            <div class="tag">
                ${tag}
                <span class="tag-remove" data-tag="${tag}">✕</span>
            </div>
        `
      )
      .join("");

    tagsList.querySelectorAll(".tag-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tag = e.target.dataset.tag;
        const note = this.notes.find((n) => n.id === this.currentNoteId);
        if (note) {
          note.tags = note.tags.filter((t) => t !== tag);
          this.updateCurrentNote({ tags: note.tags });
          this.renderTags(note.tags);
          this.markUnsaved();
        }
      });
    });
  }

  updateColorPicker() {
    const note = this.notes.find((n) => n.id === this.currentNoteId);
    if (note) {
      document.querySelectorAll(".color-option").forEach((option) => {
        option.classList.remove("active");
        if (option.dataset.color === note.color) {
          option.classList.add("active");
        }
      });

      const editorContainer = document.getElementById("editorContainer");
      const colorMap = {
        white: "#ffffff",
        yellow: "#fffacd",
        pink: "#ffe4e1",
        blue: "#e6f2ff",
        green: "#f0fff0",
        purple: "#f3e5f5",
      };
      editorContainer.style.backgroundColor = colorMap[note.color] || "#ffffff";
    }
  }

  filterNotes(searchText) {
    const lowerSearchText = searchText.toLowerCase();
    const filtered = this.notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerSearchText) ||
        note.content.toLowerCase().includes(lowerSearchText) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowerSearchText))
    );
    this.renderNotesList(filtered);
  }

  exportAsTxt() {
    if (this.notes.length === 0) {
      this.showToast("没有笔记可导出", "error");
      return;
    }

    let content = "========================================\n";
    content += "             笔记本导出文件\n";
    content += "========================================\n\n";
    content += `导出时间: ${new Date().toLocaleString("zh-CN")}\n`;
    content += `笔记总数: ${this.notes.length}\n\n`;
    content += "========================================\n\n";

    this.notes.forEach((note, index) => {
      content += `第 ${index + 1} 篇 - ${note.title}\n`;
      content += `-----------------------------------------\n`;
      content += `创建时间: ${note.createdTime}\n`;
      content += `修改时间: ${note.modifiedTime}\n`;

      if (note.tags.length > 0) {
        content += `标签: ${note.tags.join(", ")}\n`;
      }

      content += "\n内容:\n";
      content += note.content || "(空笔记)\n";
      content += "\n\n========================================\n\n";
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast("已导出为TXT文件", "success");
  }

  exportAsJson() {
    if (this.notes.length === 0) {
      this.showToast("没有笔记可导出", "error");
      return;
    }

    const data = {
      exportTime: new Date().toLocaleString("zh-CN"),
      noteCount: this.notes.length,
      notes: this.notes,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast("已导出为JSON文件", "success");
  }

  importNotes(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // 处理两种格式
        let importedNotes = [];
        if (Array.isArray(data)) {
          importedNotes = data;
        } else if (data.notes && Array.isArray(data.notes)) {
          importedNotes = data.notes;
        } else {
          throw new Error("不支持的文件格式");
        }

        if (importedNotes.length === 0) {
          this.showToast("导入的文件中没有笔记", "error");
          return;
        }

        // 避免ID冲突
        importedNotes.forEach((note) => {
          if (this.notes.some((n) => n.id === note.id)) {
            note.id = Date.now() + Math.random();
          }
        });

        this.notes = [...importedNotes, ...this.notes];
        this.saveNotes();
        this.render();

        if (this.notes.length > 0) {
          this.selectNote(this.notes[0].id);
        }

        this.showToast(`已成功导入 ${importedNotes.length} 条笔记`, "success");
      } catch (error) {
        this.showToast("导入失败: 文件格式不正确或已损坏", "error");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);

    // 重置文件输入
    document.getElementById("importFile").value = "";
  }

  render() {
    this.renderNotesList(this.notes);
    if (this.notes.length === 0) {
      document.getElementById("emptyState").style.display = "flex";
      document.getElementById("editorContainer").style.display = "none";
    }
  }

  renderNotesList(notes) {
    const notesList = document.getElementById("notesList");
    if (notes.length === 0) {
      notesList.innerHTML =
        '<div style="padding: 20px; color: #999; text-align: center;">没有找到笔记</div>';
      return;
    }

    notesList.innerHTML = notes
      .map(
        (note) => `
            <div class="note-item ${
              note.id === this.currentNoteId ? "active" : ""
            }" 
                 data-id="${note.id}"
                 style="border-left: 4px solid ${this.getColorValue(
                   note.color
                 )};">
                <div class="note-item-title">${note.title || "未命名"}</div>
                <div class="note-item-preview">${(note.content || "(空笔记)")
                  .substring(0, 50)
                  .replace(/\n/g, " ")}...</div>
                <div class="note-item-date">${note.modifiedTime}</div>
            </div>
        `
      )
      .join("");

    notesList.querySelectorAll(".note-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = parseInt(item.dataset.id);
        this.selectNote(id);
      });
    });

    this.updateCharCount();
  }

  getColorValue(color) {
    const colorMap = {
      white: "#e0e0e0",
      yellow: "#ffc107",
      pink: "#ff69b4",
      blue: "#2196f3",
      green: "#4caf50",
      purple: "#9c27b0",
    };
    return colorMap[color] || "#e0e0e0";
  }

  showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  saveNotes() {
    try {
      localStorage.setItem("notebook_pro_notes", JSON.stringify(this.notes));
      this.unsavedChanges = false;
    } catch (error) {
      console.error("Save error:", error);
      this.showToast("保存失败: 本地存储已满", "error");
    }
  }

  loadNotes() {
    try {
      const saved = localStorage.getItem("notebook_pro_notes");
      this.notes = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Load error:", error);
      this.notes = [];
      this.showToast("加载笔记失败", "error");
    }
  }
}

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
  new NoteManager();
});
