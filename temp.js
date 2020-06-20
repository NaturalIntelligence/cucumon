function parseFile(filePath){
    const inputStream = require('fs').createReadStream(filePath);
    const lineReader = require('readline').createInterface({
        input: inputStream
    });
    lineReader.on('line', function (line) {
        readLine(line.trim())
    });
    
    inputStream.on('end', function () {
        readLine(oldLine)
    });

    

}

let lineCounter = 0;
let oldLine;
function readLine(line){
    lineCounter++;
    if(line.length !== 0){
        if(!oldLine) oldLine = line;
        else{
            console.log(lineCounter, oldLine);
            oldLine = line
        }
    }
}

parseFile("./sample.feature")