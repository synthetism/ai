/**
 * CALCULATOR UNIT - Mathematical operations for AI
 * 
 * Demonstrates operator units that provide capabilities to AI.
 * Shows how Unit Architecture makes AI tool integration effortless.
 * 
 * @example
 * ```typescript
 * const calculator = CalculatorUnit.create();
 * const ai = AIUnit.create();
 * 
 * // AI can now use calculator through tools
 * await ai.tools([calculator.teach()], {
 *   instructions: "Calculate 25 * 4 + 100 and explain the result"
 * });
 * ```
 */

import { Unit, createUnitSchema, type UnitProps, type TeachingContract } from '@synet/unit';

// =============================================================================
// CALCULATOR INTERFACES
// =============================================================================

export interface CalculatorConfig {
  precision?: number;
  maxValue?: number;
  metadata?: Record<string, unknown>;
}

export interface CalculatorProps extends UnitProps {
  precision: number;
  maxValue: number;
}

export interface CalculationResult {
  result: number;
  operation: string;
  timestamp: Date;
}

// =============================================================================
// CALCULATOR UNIT IMPLEMENTATION
// =============================================================================

/**
 * Calculator Unit - Mathematical operations for AI tools
 * 
 * This unit provides mathematical capabilities that AI can discover
 * and use through the universal tools interface.
 */
export class CalculatorUnit extends Unit<CalculatorProps> {
  protected constructor(props: CalculatorProps) {
    super(props);
  }

  static create(config: CalculatorConfig = {}): CalculatorUnit {
    const props: CalculatorProps = {
      dna: createUnitSchema({
        id: 'calculator',
        version: '1.0.0'
      }),
      created: new Date(),
      metadata: config.metadata || {},
      precision: config.precision || 10,
      maxValue: config.maxValue || Number.MAX_SAFE_INTEGER
    };

    return new CalculatorUnit(props);
  }

  whoami(): string {
    return `🧮 CalculatorUnit - Mathematical operations for AI (${this.dna.id})`;
  }

  capabilities(): string[] {
    const native = ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'calculate', 'factorial'];
    const learned = Array.from(this._capabilities.keys());
    return [...native, ...learned];
  }

  help(): void {
    console.log(`
🧮 CalculatorUnit - Mathematical Operations

Native Capabilities:
• add(a, b) - Addition: a + b
• subtract(a, b) - Subtraction: a - b  
• multiply(a, b) - Multiplication: a * b
• divide(a, b) - Division: a / b
• power(base, exponent) - Exponentiation: base^exponent
• sqrt(number) - Square root
• calculate(expression) - Evaluate mathematical expression
• factorial(n) - Calculate factorial: n!

Configuration:
• Precision: ${this.props.precision} decimal places
• Max Value: ${this.props.maxValue}

Usage Examples:
  await calculator.add(25, 75);
  await calculator.calculate("(25 * 4) + 100");
  
AI Integration:
  await ai.tools([calculator.teach()]);
  // AI can now use all mathematical operations
`);
  }

  teach(): TeachingContract {
    return {
      unitId: this.dna.id,
      capabilities: {
        'add': (...args: unknown[]) => this.add(args[0] as number, args[1] as number),
        'subtract': (...args: unknown[]) => this.subtract(args[0] as number, args[1] as number),
        'multiply': (...args: unknown[]) => this.multiply(args[0] as number, args[1] as number),
        'divide': (...args: unknown[]) => this.divide(args[0] as number, args[1] as number),
        'power': (...args: unknown[]) => this.power(args[0] as number, args[1] as number),
        'sqrt': (...args: unknown[]) => this.sqrt(args[0] as number),
        'calculate': (...args: unknown[]) => this.calculate(args[0] as string),
        'factorial': (...args: unknown[]) => this.factorial(args[0] as number)
      }
    };
  }

  // =============================================================================
  // MATHEMATICAL OPERATIONS
  // =============================================================================

  /**
   * Addition operation
   */
  async add(a: number, b: number): Promise<CalculationResult> {
    this.validateNumbers(a, b);
    const result = this.roundToPrecision(a + b);
    
    return {
      result,
      operation: `${a} + ${b} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Subtraction operation
   */
  async subtract(a: number, b: number): Promise<CalculationResult> {
    this.validateNumbers(a, b);
    const result = this.roundToPrecision(a - b);
    
    return {
      result,
      operation: `${a} - ${b} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Multiplication operation
   */
  async multiply(a: number, b: number): Promise<CalculationResult> {
    this.validateNumbers(a, b);
    const result = this.roundToPrecision(a * b);
    
    return {
      result,
      operation: `${a} × ${b} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Division operation
   */
  async divide(a: number, b: number): Promise<CalculationResult> {
    this.validateNumbers(a, b);
    
    if (b === 0) {
      throw new Error('[CalculatorUnit] Division by zero is not allowed');
    }
    
    const result = this.roundToPrecision(a / b);
    
    return {
      result,
      operation: `${a} ÷ ${b} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Power operation
   */
  async power(base: number, exponent: number): Promise<CalculationResult> {
    this.validateNumbers(base, exponent);
    const result = this.roundToPrecision(base ** exponent);
    
    return {
      result,
      operation: `${base}^${exponent} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Square root operation
   */
  async sqrt(number: number): Promise<CalculationResult> {
    this.validateNumbers(number);
    
    if (number < 0) {
      throw new Error('[CalculatorUnit] Cannot calculate square root of negative number');
    }
    
    const result = this.roundToPrecision(Math.sqrt(number));
    
    return {
      result,
      operation: `√${number} = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Factorial operation
   */
  async factorial(n: number): Promise<CalculationResult> {
    this.validateNumbers(n);
    
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('[CalculatorUnit] Factorial requires non-negative integer');
    }
    
    if (n > 170) {
      throw new Error('[CalculatorUnit] Factorial too large (max 170)');
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    return {
      result,
      operation: `${n}! = ${result}`,
      timestamp: new Date()
    };
  }

  /**
   * Evaluate mathematical expression
   */
  async calculate(expression: string): Promise<CalculationResult> {
    if (!expression || typeof expression !== 'string') {
      throw new Error('[CalculatorUnit] Invalid expression provided');
    }

    // Basic security check - only allow numbers, operators, parentheses, and spaces
    const allowedChars = /^[0-9+\-*/().^√ \s]+$/;
    if (!allowedChars.test(expression)) {
      throw new Error('[CalculatorUnit] Expression contains invalid characters');
    }

    try {
      // Simple expression evaluator - replace with mathjs in production
      const sanitized = expression
        .replace(/\^/g, '**')  // Convert ^ to ** for JavaScript
        .replace(/√/g, 'Math.sqrt');  // Convert √ to Math.sqrt
      
      // Use Function constructor for safer evaluation than eval
      const result = new Function(`"use strict"; return (${sanitized})`)();
      
      if (!Number.isFinite(result)) {
        throw new Error('Result is not a finite number');
      }
      
      const rounded = this.roundToPrecision(result);
      
      return {
        result: rounded,
        operation: `${expression} = ${rounded}`,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`[CalculatorUnit] Expression evaluation failed: ${error}`);
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private validateNumbers(...numbers: number[]): void {
    for (const num of numbers) {
      if (typeof num !== 'number' || !Number.isFinite(num)) {
        throw new Error('[CalculatorUnit] Invalid number provided');
      }
      
      if (Math.abs(num) > this.props.maxValue) {
        throw new Error(`[CalculatorUnit] Number exceeds maximum value (${this.props.maxValue})`);
      }
    }
  }

  private roundToPrecision(value: number): number {
    return Number(value.toFixed(this.props.precision));
  }
}
