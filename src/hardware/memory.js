// src/hardware/memory.js

/**
 * Emulates 1MB of segmented RAM (x86 Real Mode) and the BIOS Data Area (BDA).
 * This allows Sysclone to support low-level hardware tricks used in legacy games.
 */
export class Memory {
    constructor(io) {
        this.io = io; // Link I/O to allow memory writes to trigger hardware reactions
        
        // 1 Megabyte of RAM (Typical for DOS Real Mode)
        this.ram = new Uint8Array(1024 * 1024); 
        
        // Default Segment (In QBasic, this is DGROUP, but we initialize to 0)
        this.currentSegment = 0; 

        this.initBIOSDataArea();
    }

    /**
     * Initializes the BDA (BIOS Data Area) starting at physical address 0x0400 (Segment 0x0040).
     */
    initBIOSDataArea() {
        // 1. Equipment Word (Address 0x0410)
        // Nibbles check: (PEEK(&H410) AND &H30) <> &H30 to detect Monochrome (0x30) vs Color.
        // We set 0x20 to simulate a Color VGA card with a math co-processor.
        this.ram[0x0410] = 0x20;

        // 2. Circular Keyboard Buffer Pointers
        // Head: 0x041A, Tail: 0x041C
        // The physical buffer is located between 0x001E and 0x003D. We initialize pointers to 0x001E.
        this.ram[0x041A] = 0x1E;
        this.ram[0x041C] = 0x1E;
    }

    /**
     * Equivalent to QBasic command: DEF SEG = segment
     */
    defSeg(segment) {
        // If segment is null/undefined, QBasic restores the program's default segment.
        // For now, we handle explicit values (e.g., DEF SEG = 0).
        this.currentSegment = segment || 0;
    }

    /**
     * Equivalent to QBasic command: PEEK(offset)
     */
    peek(offset) {
        // x86 Address Calculation: (Segment * 16 + Offset)
        const physicalAddress = (this.currentSegment << 4) + offset;
        return this.ram[physicalAddress];
    }

    /**
     * Equivalent to QBasic command: POKE offset, value
     * Includes support for Memory-Mapped I/O (MMIO) emulation.
     */
    poke(offset, value) {
        const physicalAddress = (this.currentSegment << 4) + offset;
        
        // Ensure we only write a single byte (0-255)
        const byteValue = value & 0xFF;
        this.ram[physicalAddress] = byteValue;

        // --- Hardware Reaction Emulation (Memory-Mapped I/O) ---

        // Nibbles keyboard flush hack: "POKE &H41A, PEEK(&H41C)"
        // If the program writes to the Keyboard Buffer "Head" address (0x041A)
        if (physicalAddress === 0x041A) {
            // And sets the Head to the same value as the Tail (0x041C)
            if (this.ram[0x041A] === this.ram[0x041C]) {
                // Then we flush the actual JavaScript keyboard buffer in our I/O controller!
                this.io.clearKeyBuffer();
            }
        }
    }
}