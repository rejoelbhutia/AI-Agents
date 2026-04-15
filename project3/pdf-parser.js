import pdf from 'pdf-parse-new';
import fs from "fs";

export const pdfParser = async (pdfPath) => {
    // 1. Save the original console methods at the very top
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;

    try {
        const file = fs.readFileSync(pdfPath);
        
        // Use the normal log to show progress BEFORE muting
        console.log("File loaded successfully into buffer. Extracting text in silence...");
        
        // 2. Mute everything right before the noisy function
        console.log = () => {};
        console.info = () => {};
        console.warn = () => {};

        // 3. Run the parser
        let data = await pdf(file);

        // Return the clean string
        return data.text; 
        
    } catch (error) {
        // Temporarily restore the log just to print the error
        console.log = originalLog;
        console.log("Error parsing PDF: ", error.message);
        return null; 
        
    } finally {
        // 4. The 'finally' block ALWAYS runs, ensuring your console 
        // is restored back to normal for the rest of your app!
        console.log = originalLog;
        console.info = originalInfo;
        console.warn = originalWarn;
    }
}