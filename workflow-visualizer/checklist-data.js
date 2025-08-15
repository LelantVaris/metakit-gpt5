// Master Checklist Data - All 85 checks with complete details
const masterChecklistData = {
  "name": "Firecrawl Content Audit Master Checklist",
  "version": "1.0",
  "total_checks": 85,
  "categories": [
    {
      "name": "Personality (PVOD)",
      "color": "#9C27B0",
      "checks": [
        {
          "id": "P001",
          "label": "Conversational Tone",
          "description": "Uses conversational tone with contractions",
          "params": {
            "patterns": ["don't", "won't", "it's", "we're", "you're"],
            "min_count": 3,
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "P002",
          "label": "Direct Address",
          "description": "Addresses reader as 'You' directly",
          "params": {
            "patterns": ["You", "your"],
            "severity": "low",
            "auto_fixable": true
          }
        },
        {
          "id": "P003",
          "label": "Humor & Metaphors",
          "description": "Includes appropriate humor or metaphors",
          "params": {
            "detection": "AI check",
            "severity": "low",
            "auto_fixable": false
          }
        },
        {
          "id": "P004",
          "label": "Avoid AI Tropes",
          "description": "Avoids AI tropes and sounds human",
          "params": {
            "avoid_patterns": ["meticulous", "seamless", "robust", "comprehensive"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "P005",
          "label": "Simple Language",
          "description": "Uses simple, approachable language",
          "params": {
            "readability_max": 60,
            "severity": "medium",
            "auto_fixable": true
          }
        }
      ]
    },
    {
      "name": "Value (PVOD)",
      "color": "#4CAF50",
      "checks": [
        {
          "id": "V001",
          "label": "Actionable Insights",
          "description": "Contains new, actionable insights",
          "params": {
            "detection": "AI check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "V002",
          "label": "Real Examples",
          "description": "Includes real examples with company names",
          "params": {
            "patterns": ["Inc.", "LLC", "Ltd.", "Corp.", "Company"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "V003",
          "label": "Fact-Checked",
          "description": "All information is fact-checked",
          "params": {
            "detection": "Web search validation",
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "V004",
          "label": "Practical Content",
          "description": "Content is practical and actionable",
          "params": {
            "patterns": ["step", "how to", "guide", "tutorial", "example"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "V005",
          "label": "No Filler",
          "description": "Eliminates filler content",
          "params": {
            "avoid_patterns": ["it is important to note", "as we all know", "obviously"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "V006",
          "label": "Engaging Headings",
          "description": "Headings are engaging, not boring",
          "params": {
            "avoid_patterns": ["Understanding", "Overview of", "Introduction to"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "V007",
          "label": "Audience Context",
          "description": "Provides necessary context for target audience",
          "params": {
            "detection": "AI audience analysis",
            "severity": "medium",
            "auto_fixable": false
          }
        }
      ]
    },
    {
      "name": "Opinion (PVOD)",
      "color": "#FF9800",
      "checks": [
        {
          "id": "O001",
          "label": "Novel Perspective",
          "description": "Takes a novel perspective or unexpected angle",
          "params": {
            "detection": "Manual check",
            "severity": "medium",
            "auto_fixable": false
          }
        },
        {
          "id": "O002",
          "label": "Evidence-Based",
          "description": "Opinions anchored in real-world context",
          "params": {
            "patterns": ["research", "study", "data", "survey", "report"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "O003",
          "label": "No Clichés",
          "description": "Avoids stereotypes and clichés",
          "params": {
            "avoid_patterns": ["think outside the box", "game-changer", "best practices"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "O004",
          "label": "Diverse Sources",
          "description": "Uses range of voices and sources",
          "params": {
            "detection": "AI check",
            "severity": "low",
            "auto_fixable": false
          }
        },
        {
          "id": "O005",
          "label": "Unique Title",
          "description": "Title shows unique angle",
          "params": {
            "detection": "Title uniqueness check",
            "severity": "high",
            "auto_fixable": true
          }
        }
      ]
    },
    {
      "name": "Direct (PVOD)",
      "color": "#2196F3",
      "checks": [
        {
          "id": "D001",
          "label": "No Fluff",
          "description": "No fluff or filler phrases",
          "params": {
            "avoid_patterns": ["furthermore", "moreover", "additionally"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "D002",
          "label": "Short Paragraphs",
          "description": "Paragraphs maximum 4 lines",
          "params": {
            "max_lines": 4,
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "D003",
          "label": "Simple Sentences",
          "description": "Uses simple words and sentences",
          "params": {
            "max_words_per_sentence": 25,
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "D004",
          "label": "Concise Intro",
          "description": "Introduction is 60-100 words max",
          "params": {
            "min_words": 60,
            "max_words": 100,
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "D005",
          "label": "Scannable Format",
          "description": "Uses bullet points and lists for scannability",
          "params": {
            "patterns": ["* ", "- ", "• ", "1. "],
            "severity": "low",
            "auto_fixable": true
          }
        },
        {
          "id": "D006",
          "label": "Varied Structure",
          "description": "Varies sentence structure",
          "params": {
            "detection": "Sentence variety check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "D007",
          "label": "Logical Flow",
          "description": "Content flows logically with clear progression",
          "params": {
            "detection": "Structure check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "D008",
          "label": "Balanced Humor",
          "description": "Humor doesn't interfere with value",
          "params": {
            "detection": "AI check",
            "severity": "low",
            "auto_fixable": false
          }
        }
      ]
    },
    {
      "name": "Content Quality",
      "color": "#607D8B",
      "checks": [
        {
          "id": "CP001",
          "label": "Quick Answer",
          "description": "Target query answered in first 50 words",
          "params": {
            "max_words": 50,
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "CP002",
          "label": "Keyword Frequency",
          "description": "Main keyword used naturally 5-7 times",
          "params": {
            "min_count": 5,
            "max_count": 7,
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "CP003",
          "label": "Meta Keywords",
          "description": "Meta description includes main keyword",
          "params": {
            "detection": "Meta tag check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "CP004",
          "label": "New Information",
          "description": "Content provides NEW information not in competitors",
          "params": {
            "detection": "Manual check",
            "severity": "critical",
            "auto_fixable": false
          }
        },
        {
          "id": "CP005",
          "label": "Specific Examples",
          "description": "Real examples with company names and specific results",
          "params": {
            "detection": "Example specificity check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "CP006",
          "label": "Show Don't Tell",
          "description": "Shows don't tell - concrete examples over abstract",
          "params": {
            "detection": "Concrete example check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "CP007",
          "label": "Evidence-Based",
          "description": "Takes stance backed by evidence",
          "params": {
            "detection": "Evidence check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "CP008",
          "label": "Value Title",
          "description": "Title includes value proposition + unique angle",
          "params": {
            "detection": "Title analysis",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "CP009",
          "label": "10-Second Test",
          "description": "Content is scannable (passes 10-second test)",
          "params": {
            "detection": "Scannability check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "CP010",
          "label": "Every Paragraph Valuable",
          "description": "Every paragraph earns its place (adds value)",
          "params": {
            "detection": "Paragraph value check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "CP011",
          "label": "Actionable Takeaways",
          "description": "Actionable takeaways provided",
          "params": {
            "detection": "Actionable content check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "CP012",
          "label": "Sourced Statistics",
          "description": "Sources linked for all statistics",
          "params": {
            "detection": "Statistics source check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "CP013",
          "label": "Intent Satisfied",
          "description": "Search intent fully satisfied",
          "params": {
            "detection": "Intent satisfaction check",
            "severity": "critical",
            "auto_fixable": false
          }
        }
      ]
    },
    {
      "name": "AI Pattern Avoidance",
      "color": "#F44336",
      "checks": [
        {
          "id": "AI001",
          "label": "No 'Not Just X, But Also Y'",
          "description": "Avoids 'Not Just X, But Also Y' construction",
          "params": {
            "avoid_pattern": "not just X, but also Y",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "AI002",
          "label": "No Em Dashes",
          "description": "No em dashes used",
          "params": {
            "avoid_pattern": "—",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "AI003",
          "label": "No Buzzwords",
          "description": "Avoids generic superlatives and buzzwords",
          "params": {
            "avoid_patterns": ["revolutionary", "game-changing", "cutting-edge", "seamless"],
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "AI004",
          "label": "Natural Starters",
          "description": "Avoids overly formal sentence starters",
          "params": {
            "avoid_patterns": ["In today's digital landscape", "In an era where"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "AI005",
          "label": "No Redundant Transitions",
          "description": "Avoids redundant transitional phrases",
          "params": {
            "avoid_patterns": ["Furthermore", "Moreover", "Additionally"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "AI006",
          "label": "Natural Conclusions",
          "description": "Avoids formulaic conclusions",
          "params": {
            "avoid_patterns": ["In conclusion", "To sum up", "All in all"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "AI007",
          "label": "Contractions Used",
          "description": "Uses contractions naturally",
          "params": {
            "min_ratio": 0.02,
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "AI008",
          "label": "Casual Phrases",
          "description": "Includes casual phrases",
          "params": {
            "patterns": ["honestly", "to be fair", "here's the thing"],
            "min_count": 1,
            "severity": "low",
            "auto_fixable": true
          }
        },
        {
          "id": "AI009",
          "label": "Specific Details",
          "description": "Uses specific details over generic claims",
          "params": {
            "detection": "Specificity check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "AI010",
          "label": "Balanced Views",
          "description": "Includes balanced perspectives (pros AND cons)",
          "params": {
            "detection": "Balance check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "AI011",
          "label": "Personal Voice",
          "description": "Includes personal voice indicators",
          "params": {
            "patterns": ["I think", "In my view", "I prefer"],
            "severity": "low",
            "auto_fixable": false
          }
        },
        {
          "id": "AI012",
          "label": "Industry Terms",
          "description": "Uses industry-specific terminology",
          "params": {
            "detection": "AI check",
            "severity": "medium",
            "auto_fixable": false
          }
        }
      ]
    },
    {
      "name": "NLP Optimization",
      "color": "#00BCD4",
      "checks": [
        {
          "id": "NLP001",
          "label": "SVO Structure",
          "description": "Uses Subject-Verb-Object structure",
          "params": {
            "detection": "Sentence structure analysis",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP002",
          "label": "Direct Answers",
          "description": "Answers questions directly (echo + answer)",
          "params": {
            "detection": "Question-answer check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP003",
          "label": "One Idea Per Sentence",
          "description": "One idea per sentence",
          "params": {
            "detection": "Sentence complexity check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP004",
          "label": "Short Paragraphs",
          "description": "Short paragraphs (2-4 lines max)",
          "params": {
            "max_lines": 4,
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP005",
          "label": "Precise Words",
          "description": "Uses precise words over vague ones",
          "params": {
            "detection": "Precision check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP006",
          "label": "Active Voice",
          "description": "Uses active voice over passive",
          "params": {
            "max_passive_ratio": 0.1,
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP007",
          "label": "No Filler Words",
          "description": "Avoids filler words",
          "params": {
            "avoid_patterns": ["just", "actually", "basically", "kind of"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP008",
          "label": "No AI Fluff",
          "description": "Avoids AI fluff words",
          "params": {
            "avoid_patterns": ["meticulous", "seamless", "robust", "comprehensive"],
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP009",
          "label": "Strong Language",
          "description": "Avoids weak qualifiers",
          "params": {
            "avoid_patterns": ["perhaps", "maybe", "sometimes", "it seems"],
            "severity": "low",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP010",
          "label": "No Double Negatives",
          "description": "Avoids double negatives",
          "params": {
            "detection": "Double negative check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP011",
          "label": "No Clichés",
          "description": "Avoids clichés",
          "params": {
            "avoid_patterns": ["think outside the box", "game-changer"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP012",
          "label": "Clear Subjects",
          "description": "Avoids buried subjects",
          "params": {
            "detection": "Subject position check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP013",
          "label": "No Run-ons",
          "description": "Avoids run-on sentences",
          "params": {
            "max_words": 30,
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP014",
          "label": "Main Point First",
          "description": "Main point comes first",
          "params": {
            "detection": "Structure check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP015",
          "label": "Easy Skim",
          "description": "Easy to skim and understand",
          "params": {
            "detection": "Skim test",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "NLP016",
          "label": "Conversational",
          "description": "Sounds conversational, not robotic",
          "params": {
            "detection": "Conversational check",
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "NLP017",
          "label": "FAQ Echo",
          "description": "FAQ answers echo the question",
          "params": {
            "detection": "FAQ echo check",
            "severity": "high",
            "auto_fixable": true
          }
        }
      ]
    },
    {
      "name": "SEO Compliance",
      "color": "#8BC34A",
      "checks": [
        {
          "id": "S001",
          "label": "Keyword Early",
          "description": "Primary keyword in first 50 words",
          "params": {
            "max_position": 50,
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "S002",
          "label": "Intent at Top",
          "description": "Search intent addressed at top",
          "params": {
            "detection": "Intent check",
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "S003",
          "label": "Keyword in Title",
          "description": "Primary keyword in title",
          "params": {
            "detection": "Title keyword check",
            "severity": "critical",
            "auto_fixable": true
          }
        },
        {
          "id": "S004",
          "label": "Keyword in H2",
          "description": "Primary keyword in at least one H2",
          "params": {
            "detection": "H2 keyword check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "S005",
          "label": "Keyword in Conclusion",
          "description": "Primary keyword in conclusion",
          "params": {
            "detection": "Conclusion keyword check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "S006",
          "label": "Secondary Keywords",
          "description": "Secondary keywords used naturally",
          "params": {
            "detection": "Secondary keyword check",
            "severity": "medium",
            "auto_fixable": false
          }
        },
        {
          "id": "S007",
          "label": "Internal Links",
          "description": "At least 4 internal links",
          "params": {
            "min_internal": 4,
            "severity": "medium",
            "auto_fixable": false
          }
        },
        {
          "id": "S008",
          "label": "External Links",
          "description": "At least 1 external link to reputable source",
          "params": {
            "min_external": 1,
            "severity": "medium",
            "auto_fixable": false
          }
        },
        {
          "id": "S009",
          "label": "Sourced Examples",
          "description": "Uses real examples with sources",
          "params": {
            "detection": "Example source check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "S010",
          "label": "Stats with Sources",
          "description": "Includes statistics with linked sources",
          "params": {
            "detection": "Statistics source check",
            "severity": "medium",
            "auto_fixable": false
          }
        },
        {
          "id": "S011",
          "label": "Title Length",
          "description": "Title is 50-60 characters",
          "params": {
            "min_chars": 50,
            "max_chars": 60,
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "S012",
          "label": "Title Value",
          "description": "Title contains value proposition",
          "params": {
            "detection": "Title value check",
            "severity": "high",
            "auto_fixable": false
          }
        },
        {
          "id": "S013",
          "label": "Original Title",
          "description": "Title is unique (not copied)",
          "params": {
            "detection": "Title originality check",
            "severity": "critical",
            "auto_fixable": false
          }
        },
        {
          "id": "S014",
          "label": "Numbers in Title",
          "description": "Title uses numbers if applicable",
          "params": {
            "detection": "Title number check",
            "severity": "low",
            "auto_fixable": true
          }
        },
        {
          "id": "S015",
          "label": "No Clickbait",
          "description": "Avoids clickbait in title",
          "params": {
            "detection": "Clickbait check",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "T001",
          "label": "Avoid Corporate Words",
          "description": "Avoids words like 'efficiency', 'streamline', 'solutions'",
          "params": {
            "avoid_patterns": ["efficiency", "streamline", "solutions", "maximize"],
            "severity": "medium",
            "auto_fixable": true
          }
        },
        {
          "id": "T002",
          "label": "Keyword Front-loaded",
          "description": "Front-loads primary keyword",
          "params": {
            "detection": "Keyword position in title",
            "severity": "high",
            "auto_fixable": true
          }
        },
        {
          "id": "T003",
          "label": "Emoji Usage",
          "description": "Uses emoji if appropriate (max 2)",
          "params": {
            "max_emojis": 2,
            "severity": "low",
            "auto_fixable": true
          }
        }
      ]
    }
  ]
};

// Export for use in visualization
if (typeof module !== 'undefined' && module.exports) {
  module.exports = masterChecklistData;
}