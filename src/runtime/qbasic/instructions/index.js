// src/runtime/qbasic/instructions/index.js
import { GraphicsISA } from './graphics_isa.js';
import { IoISA } from './io_isa.js';
import { MemoryISA } from './memory_isa.js';

export class QBasicISA {
    constructor(hw) {
        this.graphics = new GraphicsISA(hw);
        this.io = new IoISA(hw);
        this.memory = new MemoryISA(hw);
    }
}