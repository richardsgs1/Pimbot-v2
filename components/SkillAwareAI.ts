import { SkillLevel, OnboardingData, Project } from '../types';

export interface SkillContext {
  skillLevel: SkillLevel;
  methodologies: string[];
  tools: string[];
  name: string;
}

export class SkillAwareAI {
  /**
   * Get the appropriate tone and complexity for AI responses based on skill level
   */
  static getResponseStyle(skillLevel: SkillLevel): {
    tone: string;
    complexity: string;
    explanationLevel: string;
    terminology: string;
  } {
    switch (skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return {
          tone: "encouraging, supportive, and patient",
          complexity: "very simple with step-by-step explanations",
          explanationLevel: "comprehensive with background context",
          terminology: "everyday language, avoiding jargon"
        };
      
      case SkillLevel.NOVICE:
        return {
          tone: "helpful and educational",
          complexity: "straightforward with clear examples",
          explanationLevel: "detailed with some context",
          terminology: "simple project management terms with brief explanations"
        };
      
      case SkillLevel.INTERMEDIATE:
        return {
          tone: "professional and informative",
          complexity: "balanced detail level",
          explanationLevel: "focused explanations",
          terminology: "standard project management terminology"
        };
      
      case SkillLevel.EXPERIENCED:
        return {
          tone: "concise and strategic",
          complexity: "advanced insights and analysis",
          explanationLevel: "brief with strategic context",
          terminology: "professional project management language"
        };
      
      case SkillLevel.EXPERT:
        return {
          tone: "high-level and strategic",
          complexity: "sophisticated analysis and insights",
          explanationLevel: "executive-level summaries",
          terminology: "advanced terminology and industry concepts"
        };
      
      default:
        return {
          tone: "helpful and professional",
          complexity: "balanced",
          explanationLevel: "moderate detail",
          terminology: "standard language"
        };
    }
  }

  /**
   * Create a skill-aware prompt for daily briefings
   */
  static createDailyBriefingPrompt(userData: OnboardingData, projects: Project[]): string {
    const style = this.getResponseStyle(userData.skillLevel!);
    const projectCount = projects.length;
    const onTrackCount = projects.filter(p => p.status === 'On Track').length;
    const atRiskCount = projects.filter(p => p.status === 'At Risk').length;

    const basePrompt = `Generate a daily briefing for ${userData.name}, a project manager with ${userData.skillLevel} experience level. 

Current portfolio: ${projectCount} projects (${onTrackCount} on track, ${atRiskCount} at risk)
User's methodologies: ${userData.methodologies.join(', ') || 'None specified'}
User's tools: ${userData.tools.join(', ') || 'None specified'}

Project details: ${projects.map(p => `${p.name}: ${p.status}, ${p.progress}% complete, due ${p.dueDate}`).join('; ')}`;

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `${basePrompt}

Create a daily briefing that:
- Uses ${style.tone} language
- Explains basic project management concepts when mentioned
- Provides step-by-step guidance for any recommended actions
- Includes encouraging words about their learning journey
- Avoids complex terminology
- Offers simple, concrete next steps
- Explains WHY recommendations are important (educational context)

Keep it warm, supportive, and educational. Remember they're still learning the basics.`;

      case SkillLevel.NOVICE:
        return `${basePrompt}

Create a daily briefing that:
- Uses ${style.tone} language
- Provides clear explanations for recommendations
- Includes brief context for project management concepts
- Offers practical examples
- Uses simple terminology with occasional explanations
- Focuses on building their skills gradually

Be helpful and educational while building their confidence.`;

      case SkillLevel.INTERMEDIATE:
        return `${basePrompt}

Create a daily briefing that:
- Uses ${style.tone} language
- Provides balanced analysis and recommendations
- Uses standard project management terminology
- Focuses on actionable insights
- Offers strategic thinking opportunities

Be professional and informative.`;

      case SkillLevel.EXPERIENCED:
        return `${basePrompt}

Create a daily briefing that:
- Uses ${style.tone} language
- Provides strategic insights and analysis
- Focuses on high-impact recommendations
- Uses professional terminology
- Emphasizes portfolio optimization and risk management

Be concise and strategic.`;

      case SkillLevel.EXPERT:
        return `${basePrompt}

Create a daily briefing that:
- Uses ${style.tone} language
- Provides executive-level strategic analysis
- Focuses on portfolio strategy and optimization
- Uses advanced project management concepts
- Emphasizes leadership and organizational impact

Be sophisticated and strategic.`;

      default:
        return `${basePrompt}

Create a professional daily briefing with balanced detail and clear recommendations.`;
    }
  }

  /**
   * Create skill-aware chat prompts
   */
  static createChatPrompt(userData: OnboardingData, userMessage: string, context?: string): string {
    const style = this.getResponseStyle(userData.skillLevel!);
    
    const basePrompt = `You are PiMbOt AI, a project management assistant helping ${userData.name}, who has ${userData.skillLevel} experience level.

User's background:
- Experience: ${userData.skillLevel}
- Methodologies: ${userData.methodologies.join(', ') || 'None specified'}
- Tools: ${userData.tools.join(', ') || 'None specified'}

${context ? `Context: ${context}` : ''}

User's question: "${userMessage}"

Respond using:
- Tone: ${style.tone}
- Complexity: ${style.complexity}
- Explanation level: ${style.explanationLevel}
- Terminology: ${style.terminology}`;

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `${basePrompt}

Remember to:
- Explain basic concepts when you mention them
- Break down complex processes into simple steps
- Use encouraging, supportive language
- Provide examples they can relate to
- Avoid assumptions about prior knowledge
- Offer to explain anything further if needed
- Focus on building their confidence and learning`;

      case SkillLevel.NOVICE:
        return `${basePrompt}

Remember to:
- Provide clear explanations with context
- Use practical examples
- Build on concepts they likely know
- Explain terminology when first used
- Offer actionable advice
- Encourage skill development`;

      case SkillLevel.INTERMEDIATE:
        return `${basePrompt}

Remember to:
- Provide balanced analysis
- Use standard terminology appropriately
- Focus on practical applications
- Offer strategic insights
- Build on established knowledge`;

      case SkillLevel.EXPERIENCED:
        return `${basePrompt}

Remember to:
- Provide strategic insights
- Focus on optimization and efficiency
- Use professional terminology
- Offer advanced techniques
- Consider organizational impact`;

      case SkillLevel.EXPERT:
        return `${basePrompt}

Remember to:
- Provide executive-level insights
- Focus on strategic implications
- Use advanced concepts and terminology
- Consider industry trends and best practices
- Emphasize leadership and mentoring aspects`;

      default:
        return `${basePrompt}

Provide helpful, professional guidance.`;
    }
  }

  /**
   * Create skill-aware task suggestions
   */
  static createTaskSuggestionPrompt(userData: OnboardingData, project: Project): string {
    const style = this.getResponseStyle(userData.skillLevel!);

    const basePrompt = `Suggest next tasks for project "${project.name}" (${project.status}, ${project.progress}% complete) for ${userData.name}, who has ${userData.skillLevel} experience.

Current tasks: ${project.tasks.map(t => `${t.name} (${t.completed ? 'Done' : 'Pending'})`).join(', ')}`;

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `${basePrompt}

Suggest tasks that are:
- Simple and clearly defined
- Have step-by-step guidance included
- Build fundamental project management skills
- Include learning opportunities
- Are not overwhelming in scope
- Come with explanations of WHY they're important

Use encouraging language and explain any project management concepts mentioned.`;

      case SkillLevel.NOVICE:
        return `${basePrompt}

Suggest tasks that:
- Build on basic skills they're developing
- Include clear guidance and examples
- Introduce intermediate concepts gradually
- Are practical and actionable
- Help them grow their capabilities

Provide educational context where helpful.`;

      case SkillLevel.INTERMEDIATE:
        return `${basePrompt}

Suggest tasks that:
- Leverage their existing skills
- Introduce strategic thinking opportunities
- Balance detail with efficiency
- Consider project optimization
- Build leadership capabilities`;

      case SkillLevel.EXPERIENCED:
        return `${basePrompt}

Suggest tasks that:
- Focus on strategic impact
- Emphasize efficiency and optimization
- Consider cross-project dependencies
- Include mentoring or team development
- Address complex project challenges`;

      case SkillLevel.EXPERT:
        return `${basePrompt}

Suggest tasks that:
- Have organizational impact
- Focus on portfolio strategy
- Include innovation opportunities
- Consider industry best practices
- Emphasize leadership and strategic planning`;

      default:
        return `${basePrompt}

Suggest practical, actionable tasks.`;
    }
  }

  /**
   * Get user-appropriate help text for different features
   */
  static getFeatureHelp(skillLevel: SkillLevel, feature: string): string {
    const helpText: Record<string, Record<SkillLevel, string>> = {
      timeline: {
        [SkillLevel.NO_EXPERIENCE]: "The Timeline view shows when your projects and tasks are scheduled. Think of it like a calendar for your work - it helps you see what needs to be done when, and if anything might be running late.",
        [SkillLevel.NOVICE]: "Timeline view displays project schedules and task dependencies. It's useful for spotting potential delays and understanding how tasks connect to each other.",
        [SkillLevel.INTERMEDIATE]: "Timeline provides visual project scheduling with dependency mapping and critical path analysis.",
        [SkillLevel.EXPERIENCED]: "Timeline offers portfolio scheduling overview with resource allocation visibility and bottleneck identification.",
        [SkillLevel.EXPERT]: "Timeline delivers strategic portfolio visualization with capacity planning and organizational resource optimization insights."
      },
      projectStatus: {
        [SkillLevel.NO_EXPERIENCE]: "Project status tells you how your project is doing. 'On Track' means everything is going well, 'At Risk' means there might be problems, and you should pay attention to those projects.",
        [SkillLevel.NOVICE]: "Project status indicators help you quickly identify which projects need attention and which are progressing well.",
        [SkillLevel.INTERMEDIATE]: "Status indicators provide quick visual assessment of project health and risk levels across your portfolio.",
        [SkillLevel.EXPERIENCED]: "Status tracking enables proactive risk management and resource reallocation decisions.",
        [SkillLevel.EXPERT]: "Status indicators support strategic portfolio management and stakeholder communication."
      }
    };

    return helpText[feature]?.[skillLevel] || "Feature information not available.";
  }
}

export default SkillAwareAI;