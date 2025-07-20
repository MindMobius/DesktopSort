import * as dotenv from 'dotenv';  
import * as path from 'path';  
import * as fs from 'fs';  

// 加载环境变量  
dotenv.config({ path: path.join(process.env.APP_ROOT || '', '.env') });  

interface ClassificationResult {  
  categories: {  
    [category: string]: string[];  
  };  
}  

interface ChatMessage {  
  role: 'system' | 'user' | 'assistant';  
  content: string;  
}  

interface ChatCompletionRequest {  
  model: string;  
  messages: ChatMessage[];  
  temperature?: number;  
}  

interface ChatCompletionResponse {  
  choices: {  
    message: {  
      content: string;  
    };  
  }[];  
}  

export class AIClassifier {  
  private apiKey: string;  
  private baseURL: string;  
  private model: string;  
  private isClassifying: boolean = false;  

  constructor() {  
    this.apiKey = process.env.OPENAI_API_KEY || '';  
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';  
    this.model = process.env.OPENAI_MODEL || 'gemini-2.5-flash';  
  }  

  /**  
   * 获取分类状态  
   */  
  isInProgress(): boolean {  
    return this.isClassifying;  
  }  
  
  /**
   * 从可能包含Markdown格式的字符串中提取JSON
   */
  private extractJsonFromMarkdown(text: string): string {
    // 尝试匹配Markdown代码块中的JSON
    const markdownMatch = /```(?:json)?([\s\S]*?)```/s.exec(text);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }
    
    // 如果没有Markdown格式，直接返回原文本
    return text;
  }

  /**  
   * 使用AI对应用进行分类  
   */  
  async classifyApps(appNames: string[]): Promise<ClassificationResult> {  
    try {  
      this.isClassifying = true;  
      
      const prompt = `  
        请将以下Windows应用程序分类到合适的类别中。  
        应用列表: ${appNames.join(', ')}  
        
        请以JSON格式返回结果，格式如下：  
        {  
          "categories": {  
            "办公软件": ["应用1", "应用2"],  
            "开发工具": ["应用3", "应用4"],  
            "娱乐应用": ["应用5", "应用6"],  
            "系统工具": ["应用7", "应用8"],  
            "其他": ["应用9"]  
          }  
        }  
        
        请确保每个应用只出现在一个类别中，并且所有应用都被分类。
        请直接返回JSON，不要添加任何Markdown格式或额外文本。
      `;  

      const messages: ChatMessage[] = [  
        { role: 'system', content: '你是一个专业的应用分类助手，擅长将Windows应用分类到合适的类别中。请只返回JSON格式的响应，不要添加任何Markdown格式或额外文本。' },  
        { role: 'user', content: prompt }  
      ];  

      const requestData: ChatCompletionRequest = {  
        model: this.model,  
        messages: messages,  
        temperature: 0.3,  
      };  

      // 检查代理环境变量
      const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;  
      if (proxyUrl) {  
        console.log(`使用代理: ${proxyUrl}`);  
        // 注意：Node.js的fetch API通过环境变量方式设置代理  
        // 忽略SSL证书问题  
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  
      }  

      // 发送请求  
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json',  
          'Authorization': `Bearer ${this.apiKey}`  
        },  
        body: JSON.stringify(requestData)
      });  

      if (!response.ok) {  
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);  
      }  

      const data = await response.json() as ChatCompletionResponse;  
      const rawResult = data.choices[0]?.message.content || '{"categories":{}}';  
      
      // 处理可能的Markdown格式JSON
      const jsonString = this.extractJsonFromMarkdown(rawResult);
      console.log('提取的JSON字符串:', jsonString);
      
      try {
        const parsedResult = JSON.parse(jsonString) as ClassificationResult;  
        // 保存分类结果到JSON文件  
        this.saveClassificationResult(parsedResult);  
        return parsedResult;
      } catch (parseError) {
        console.error('JSON解析错误:', parseError, '原始内容:', jsonString);
        return { categories: { '未分类': appNames } };
      }
    } catch (error) {  
      console.error('AI分类出错:', error);  
      return { categories: { '未分类': appNames } };  
    } finally {  
      this.isClassifying = false;  
    }  
  }  
  
  /**  
   * 保存分类结果到JSON文件  
   */  
  private saveClassificationResult(result: ClassificationResult): void {  
    try {  
      const savePath = path.join(process.env.APP_ROOT || '', 'classification_result.json');  
      fs.writeFileSync(savePath, JSON.stringify(result, null, 2), 'utf8');  
      console.log(`分类结果已保存到: ${savePath}`);  
    } catch (error) {  
      console.error('保存分类结果出错:', error);  
    }  
  }  
}