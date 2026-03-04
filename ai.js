const fetch = require("node-fetch");

async function analyzePerformance(data) {

    const prompt = `
You are an academic performance analyzer.

Student Marks:
${JSON.stringify(data.marks)}

Attendance:
${JSON.stringify(data.attendance)}

Give:
1. Overall performance summary
2. Weak subjects
3. Strong subjects
4. Suggestions for improvement
`;

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama3:8b",
            prompt: prompt,
            stream: false
        })
    });

    const result = await response.json();

    return result.response;
}

module.exports = { analyzePerformance };