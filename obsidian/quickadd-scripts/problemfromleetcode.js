/**
 * LeetCode Problem Fetcher for Obsidian
 * 
 * This script fetches problem data from LeetCode using an API and formats it for use in Obsidian notes.
 * It's designed to work with the QuickAdd plugin for Obsidian.
 */

// Utility functions for notifications and logging
const notice = msg => new Notice(msg, 5000);
const log = msg => console.log(msg);

// Constants
const API_URL = "http://127.0.0.1:2010/select";
const BASE_URL = "https://leetcode.cn";
const TAG_PREFIX_SETTING = "LeetCode Tag Prefix";

// QuickAdd module configuration
module.exports = {
    entry: start,
    settings: {
        name: "LeetCode Puller",
        author: "Shane Zimmerman",
        options: {
            [TAG_PREFIX_SETTING]: {
                type: "text",
                defaultValue: "leetcode/",
                placeholder: "Enter tag prefix (e.g., leetcode/)",
                description: "Prefix to be added to LeetCode tags.",
            }
        }
    }
}

// Global variables to store QuickAdd API and settings
let QuickAdd;
let Settings;

/**
 * Main entry point for the script
 * @param {Object} params - QuickAdd parameters
 * @param {Object} settings - User-defined settings
 */
async function start(params, settings) {
    QuickAdd = params;
    Settings = settings;

    const input = await promptForInput();
    if (!input) return;

    const titleSlug = extractTitleSlug(input);
    if (!titleSlug) return;

    const problemData = await getLeetCodeProblem(titleSlug);
    if (!problemData) return;

    setQuickAddVariables(problemData);
}

/**
 * Prompts the user for a LeetCode problem title slug or URL
 * @returns {string|null} The entered input or null if cancelled
 */
async function promptForInput() {
    const input = await QuickAdd.quickAddApi.inputPrompt("Enter LeetCode problem title slug or URL:");
    if (!input) {
        notice("No input entered.");
        return null;
    }
    return input;
}

/**
 * Extracts the title slug from the input (URL or title slug)
 * @param {string} input - The user input (URL or title slug)
 * @returns {string|null} The extracted title slug or null if invalid
 */
function extractTitleSlug(input) {
    // Check if the input is a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
        const url = new URL(input);
        const pathParts = url.pathname.split('/');
        const problemsIndex = pathParts.indexOf('problems');
        if (problemsIndex !== -1 && problemsIndex < pathParts.length - 1) {
            return pathParts[problemsIndex + 1];
        } else {
            notice("Invalid LeetCode URL. Unable to extract title slug.");
            return null;
        }
    }
    // If not a URL, assume it's already a title slug
    return input;
}

/**
 * Fetches problem data from the LeetCode API
 * @param {string} titleSlug - The title slug of the LeetCode problem
 * @returns {Object|null} Problem data object or null if fetching failed
 */
async function getLeetCodeProblem(titleSlug) {
    try {
        const response = await request({
            url: `${API_URL}?title=${titleSlug}`,
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = JSON.parse(response);
        log("API Response:", JSON.stringify(data, null, 2));

        return {
            id: data.questionFrontendId || "",
            title: data.title || "",
            translatedTitle: data.translatedTitle || "",
            difficulty: data.difficulty || "",
            link: data.link || `${BASE_URL}/problems/${titleSlug}`,
            topicTags: data.topicTags || [],
            // content: data.content || "",
            content: data.translatedContent || "",
            similar_questions: data.similarQuestions || "",
            hints: data.hints || [],
        };
    } catch (error) {
        console.error('Error fetching LeetCode problem:', error);
        notice("Failed to fetch problem data.");
        return null;
    }
}

/**
 * Sets QuickAdd variables with the fetched problem data
 * @param {Object} problemData - The fetched problem data
 */
function setQuickAddVariables(problemData) {
    QuickAdd.variables = {
        ...problemData,
        fileName: `${problemData.id}. ${replaceIllegalFileNameCharactersInString(problemData.translatedTitle)}`,
        tags: formatTags(problemData.topicTags),
        formattedHints: formatHints(problemData.hints),
        formattedSimilarQuestions: formatSimilarQuestions(problemData.similar_questions),
        problemStatement: formatProblemStatement(problemData.content),
    };
}

/**
 * Formats the problem statement HTML into Markdown
 * @param {string} html - The HTML problem statement
 * @returns {string} Formatted Markdown problem statement
 */
function formatProblemStatement(html) {
    if (!html) return "";
    
    let markdown = convertHtmlToMarkdown(html);
    markdown = markdown.replace(/：/g, ':');
    markdown = formatExamples(markdown);
    markdown = formatConstraints(markdown);
    markdown = formatFollowUp(markdown);

    return markdown.replace(/\n{3,}/g, '\n\n').replace(/`+$/gm, '`').trim();
}

/**
 * Converts HTML to Markdown
 * @param {string} html - The HTML to convert
 * @returns {string} Converted Markdown
 */
function convertHtmlToMarkdown(html) {
    let markdown = html
        .replace(/<p>/g, '\n\n')
        .replace(/<\/p>/g, '')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<strong[^>]*>/g, '')
        .replace(/<\/strong>/g, '')
        .replace(/<pre>/g, '`')
        .replace(/<\/pre>/g, '`')
        .replace(/<sup>(.*?)<\/sup>/g, '^$1')
        .replace(/<font[^>]*>/g, '')
        .replace(/<\/font>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g,'\'')
        .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![]($1)')
        .replace(/&quot;/g,'"');

    return formatLists(markdown);
}

/**
 * Formats HTML lists into Markdown lists
 * @param {string} markdown - The Markdown to format
 * @returns {string} Markdown with formatted lists
 */
function formatLists(markdown) {
    let listStack = [];
    let listItemNumber = {};

    return markdown.replace(/<\/?(?:ul|ol|li)>/g, (match, offset, string) => {
        switch (match) {
            case '<ul>':
                listStack.push('ul');
                return '\n';
            case '<ol>':
                listStack.push('ol');
                listItemNumber[listStack.length] = 1;
                return '\n';
            case '</ul>':
            case '</ol>':
                listStack.pop();
                return '\n';
            case '<li>':
                let indent = '  '.repeat(listStack.length - 1);
                if (listStack[listStack.length - 1] === 'ul') {
                    return `\n${indent}- `;
                } else {
                    let number = listItemNumber[listStack.length];
                    listItemNumber[listStack.length]++;
                    return `\n${indent}${number}. `;
                }
            case '</li>':
                return '';
        }
    });
}

/**
 * Formats examples in the problem statement
 * @param {string} markdown - The Markdown to format
 * @returns {string} Markdown with formatted examples
 */
function formatExamples(markdown) {
    let exampleCount = 1;
    return markdown.replace(/示例 \d+:([\s\S]*?)(?=示例 \d+:|提示:|进阶:|$)/g, (match, content) => {
        const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
        const inputMatch = content.match(/输入:?\s*([\s\S]*?)(?=输出|$)/i);
        const outputMatch = content.match(/输出:?\s*([\s\S]*?)(?=解释|$)/i);
        const explanationMatch = content.match(/解释:?\s*([\s\S]*?)$/i);
        
        let formattedExample = `>[!Example]+ 示例 ${exampleCount}\n`;
        if (imageMatch) formattedExample += `>![](${imageMatch[1]})\n>\n`;
        if (inputMatch) formattedExample += `>**输入:**\`${inputMatch[1].trim()}\`\n`;
        if (outputMatch) formattedExample += `>**输出:**\`${outputMatch[1].trim()}\`\n`;
        if (explanationMatch) {
            let explanation = explanationMatch[1].trim().replace(/\n/g, '\n>');
            formattedExample += `>**解释**: \`${explanation}\`\n`;
        }
        
        exampleCount++;
        return formattedExample + '\n';
    });
}

/**
 * Formats constraints in the problem statement
 * @param {string} markdown - The Markdown to format
 * @returns {string} Markdown with formatted constraints
 */
function formatConstraints(markdown) {
    const constraintsMatch = markdown.match(/提示:([\s\S]*?)(?=进阶:|$)/);
    if (constraintsMatch) {
        const constraintsContent = constraintsMatch[1].trim().split('\n').map(line => '>' + line.trim()).join('\n');
        return markdown.replace(/提示:[\s\S]*?(?=进阶:|$)/, `>[!warning]+ 提示\n${constraintsContent}\n\n`);
    }
    return markdown;
}

/**
 * Formats follow-up section in the problem statement
 * @param {string} markdown - The Markdown to format
 * @returns {string} Markdown with formatted follow-up section
 */
function formatFollowUp(markdown) {
    const followUpMatch = markdown.match(/进阶:([\s\S]*?)$/);
    if (followUpMatch) {
        const followUpContent = followUpMatch[1].trim();
        return markdown.replace(/进阶:[\s\S]*$/, `>[!Todo]+ 进阶\n>${followUpContent}\n`);
    }
    return markdown;
}

/**
 * Formats tags for the problem
 * @param {Array} tags - Array of tag objects
 * @returns {string} Formatted tag string
 */
function formatTags(tags) {
    if (!tags || !Array.isArray(tags)) return "";
    const prefix = Settings[TAG_PREFIX_SETTING] || "";
    return tags.map(tag => `   - ${prefix}${tag.slug.trim()}`).join('\n');
}

/**
 * Formats hints for the problem
 * @param {Array} hints - Array of hint strings
 * @returns {string} Formatted hints string
 */
function formatHints(hints) {
    if (!hints || hints.length === 0) return "No hints available.";
    // return hints.map((hint, index) => `>[!Hint]- Hint ${index + 1}\n>${stripHtmlTags(hint).replace(/\n/g, '\n>')}`).join("\n\n");
    return hints.map((hint, index) => `>- ${stripHtmlTags(hint).replace(/\n/g, '\n>')}`).join("\n");
}

/**
 * Strips HTML tags from a string
 * @param {string} html - The HTML string to strip
 * @returns {string} String without HTML tags
 */
function stripHtmlTags(html) {
    return html ? html.replace(/<[^>]*>/g, '') : "";
}


/**
 * Formats similar questions for the problem
 * @param {string} questions - Array of similar questions (str format)
 * @returns {string} Formatted questions string
 */
function formatSimilarQuestions(questions) {
    if (!questions) return "";
    const questions_json = JSON.parse(questions);
    return questions_json.map(question => `- [${question.translatedTitle}](${BASE_URL}/problems/${question.titleSlug})`).join('\n');
}


/**
 * Replaces illegal characters in a filename
 * @param {string} string - The string to process
 * @returns {string} String with illegal characters removed
 */
function replaceIllegalFileNameCharactersInString(string) {
    return string ? string.replace(/[\\,#%&{}/*<>$'":@]/g, '') : "";
}