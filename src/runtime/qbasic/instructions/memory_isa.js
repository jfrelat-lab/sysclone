// src/runtime/qbasic/instructions/memory_isa.js

/**
 * Encapsulates low-level MS-DOS memory operations.
 * Allows direct interaction with the 1MB virtual RAM stick (Segment:Offset architecture).
 * Forms part of the Virtual Instruction Set Architecture (ISA).
 */
export class MemoryISA {
    constructor(hw) {
        this.memory = hw.memory;
    }

    /**
     * Executes the POKE statement.
     * Writes a single byte directly to the system RAM at the specified offset
     * within the currently active memory segment.
     * Essential for triggering Memory-Mapped I/O (MMIO) hardware hacks 
     * (e.g., clearing the BIOS keyboard buffer at 0x41A).
     */
    executePOKE(address, value) {
        if (this.memory) this.memory.poke(address, value);
    }

    /**
     * Reads a single byte directly from the system RAM.
     * Evaluates the physical address based on the current segment.
     */
    readPEEK(address) {
        return this.memory ? this.memory.peek(address) : 0;
    }

    /**
     * Executes the DEF SEG statement.
     * Emulates memory segment selection (x86 Real Mode logic).
     * Sets the current segment for all subsequent PEEK and POKE operations. 
     * In true QBasic, calling it without an address restores the default Data Segment (DGROUP).
     */
    executeDEF_SEG(address) {
        if (this.memory) this.memory.defSeg(address);
    }
}