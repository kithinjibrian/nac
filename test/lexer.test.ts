import { Lexer } from "../src/lexer";

describe("tokenize input", () => {
    it("should return two tokens (Identifier and EOF) for identifier", () => {
        const lexer = new Lexer("iden");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "Identifier",
                value: "iden",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should return two tokens (Number and EOF) for number", () => {
        const lexer = new Lexer("100");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "Number",
                value: "100",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should return two tokens (String and EOF) for double quote strings", () => {
        const lexer = new Lexer('"string"');
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "string",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should return two tokens (String and EOF) for single quote strings", () => {
        const lexer = new Lexer("'string'");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "string",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape newlines in strings", () => {
        const lexer = new Lexer("'str\ning'");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\ning",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape tabs in strings", () => {
        const lexer = new Lexer("'str\ting'");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\ting",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape double quote in strings", () => {
        const lexer = new Lexer("'str\"ing'");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\"ing",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape single quote in strings", () => {
        const lexer = new Lexer('"str\'ing"');
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\'ing",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape double quote in strings", () => {
        const lexer = new Lexer('"str\\"ing"');
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\"ing",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });

    it("should correctly escape single quote in strings", () => {
        const lexer = new Lexer("'str\\'ing'");
        const tokens = lexer.tokenize();

        // Check the number of tokens first
        expect(tokens).toHaveLength(2);

        // Then check the specific tokens
        expect(tokens[0]).toEqual(
            expect.objectContaining({
                type: "String",
                value: "str\'ing",
            })
        );
        expect(tokens[1]).toEqual(
            expect.objectContaining({
                type: "EOF",
                value: "",
            })
        );
    });
});
