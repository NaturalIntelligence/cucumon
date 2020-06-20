'use strict';

const getAllMatches = function(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
};

const getAllRawMatches = function(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    matches.push(match);
    match = regex.exec(string);
  }
  return matches;
};

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
          value = value.replace("\\"+ch, ch);
          result.push( value )
        }else{
          continue;
        }
      }
      index = newIndex;
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
exports.splitInObject = splitInObject;
exports.getAllMatches = getAllMatches;
exports.getAllRawMatches = getAllRawMatches;
