'use strict';

/**
 * Split a string on given delimeter and trim the values.
 * Automatically skip backslashed char
 * @param {string} str 
 * @param {string} ch 
 * @returns {array}
 */
function splitOn(str, ch){
  let index = 0;
  let newIndex = 0;
  const result = [];
  while(index !== -1){
      newIndex = str.indexOf(ch, newIndex+1)
      if(newIndex !== -1){
        if(str[newIndex-1] !== "\\"){
          let value = str.substring(index + 1, newIndex).trim();
          value = value.replace("\\"+ch, ch); //FIX: change it with replace all
          result.push( value )
        }else{
          continue;
        }
      }
      index = newIndex;
  }
  return result;
}

function splitOnPipe(str){
  const splittedArr = str.split(/(?<!\\)\|/);
  const result = new Array(splittedArr.length - 2);
  for(let i = 1; i < splittedArr.length - 1; i++){
    result[i - 1] = splittedArr[i].trim().replace(/\\\|/g,"|");
  }
  return result;
}

function splitExampleHeader(str, lineNumber){
  const splittedArr = str.split("|");
  const result = new Array(splittedArr.length - 2);
  for(let i = 1; i < splittedArr.length - 1; i++){
    const headerName = splittedArr[i].trim();
    if(headerName.length === 0){
      throw new Error("Examples header should not be blank at line number" + lineNumber, lineNumber);
    }else{
      result[i - 1] = new RegExp("<"+splittedArr[i].trim() + ">", "g");
    }
  }
  return result;
}

/**
 * Split a string on given delimeter and trim the values.
 * Automatically skip backslashed char
 * @param {string} str 
 * @param {string} ch 
 * @param {arr} keys
 * @returns {object}
 */
function splitInObject(str, ch, keys){
  let index = 0;
  let newIndex = 0;
  const result = {};
  let keysCounter = 0;
  while(index !== -1){
      newIndex = str.indexOf(ch, newIndex+1)
      if(newIndex !== -1){
        if(str[newIndex-1] !== "\\"){
          let value = str.substring(index + 1, newIndex).trim();
          value = value.replace("\\"+ch, ch);
          result[keys[keysCounter++]] = value;
        }else{
          continue;
        }
      }
      index = newIndex;
  }
  return result;
}


exports.splitOn = splitOn;
exports.splitOnPipe = splitOnPipe;
exports.splitExampleHeader = splitExampleHeader;
exports.splitInObject = splitInObject;
