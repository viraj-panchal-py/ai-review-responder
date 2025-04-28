const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const reviewInput = document.getElementById("reviewInput");
const output = document.getElementById("output");
const darkToggle = document.getElementById("darkModeToggle");
const pasteClipboardBtn = document.getElementById("pasteClipboard");
const toneSelect = document.getElementById("toneSelect");
const languageSelect = document.getElementById("languageSelect");
const hotelNameInput = document.getElementById("hotelNameInput");

let openaiKey = "";

// Load settings on startup
window.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["darkMode"], (data) => {
    if (data.darkMode) {
      document.body.classList.add("dark");
      darkToggle.checked = true;
    }
  });
});

// Dark mode toggle
darkToggle.addEventListener("change", () => {
  const isDark = darkToggle.checked;
  document.body.classList.toggle("dark", isDark);
  chrome.storage.local.set({ darkMode: isDark });
});

// Paste from clipboard
pasteClipboardBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      reviewInput.value = text;
    } else {
      alert("⚠️ Clipboard is empty.");
    }
  } catch (err) {
    console.warn("❌ Clipboard read failed:", err);
    alert("❌ Clipboard access failed. Please allow clipboard permissions.");
  }
});

// Generate AI response
generateBtn.addEventListener("click", async () => {
  const review = reviewInput.value.trim();
  const tone = toneSelect.value;
  const language = languageSelect.value;
  const hotelName = hotelNameInput.value.trim();

  if (!review) {
    output.innerText = "⚠️ Please paste a review first.";
    return;
  }

  if (!openaiKey) {
    output.innerText = "❌ OpenAI API key not set.";
    return;
  }

  output.classList.remove("visible");
  output.innerText = "⏳ Generating response...";

  const toneMap = {
    friendly: "a friendly 😊",
    formal: "a formal 🧑‍⚖️",
    empathetic: "an empathetic 😇",
    analytical: "an analytical 🧐",
    excited: "an excited 🥳"
  };

  const toneText = toneMap[tone] || "a professional";

  const langInstruction = language === "auto"
    ? "Respond in the same language as the review."
    : `Respond in ${language}.`;

  const prompt = `Customer review:\n"${review}"\n\nUse ${toneText} tone. ${langInstruction}\n\nKeep the response under 150 words.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a hotel manager crafting personalized and thoughtful replies to customer reviews."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (!res.ok) {
      output.innerText = `❌ OpenAI error: ${data.error?.message || "Unknown error"}`;
      return;
    }

    let reply = data.choices?.[0]?.message?.content?.trim();

    if (reply && hotelName) {
      reply += `\n\n— ${hotelName}`;
    }

    output.innerText = reply || "⚠️ Failed to generate a response.";
    output.classList.add("visible");
  } catch (err) {
    output.innerText = "❌ Error connecting to OpenAI API.";
    console.error(err);
  }
});

// Copy to clipboard
copyBtn.addEventListener("click", () => {
  const text = output.innerText;
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerText = "✅ Copied!";
      setTimeout(() => (copyBtn.innerText = "📋 Copy Response"), 1500);
    });
  }
});
