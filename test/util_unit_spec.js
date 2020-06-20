const util = require('./../src/util');

describe("Feature file Parser", function () {
    
    it("split a string into array on given char", function() {
        expect( util.splitOn("| only |", "|")).toEqual(["only"]);
        expect( util.splitOn("|only|", "|")).toEqual(["only"]);
        expect( util.splitOn("|some|thing|", "|")).toEqual(["some", "thing"]);
        expect( util.splitOn("|back |slash\\|df |", "|")).toEqual(["back", "slash|df"]);
    });

    it("split a string into object on given char", function() {
        expect( util.splitInObject("| true |", "|", ["flag"])).toEqual( { flag: "true"});
        expect( util.splitInObject("|true|", "|", ["flag"])).toEqual( { flag: "true"});
        expect( util.splitInObject("|some|thing|", "|", ["first", "last"]) ).toEqual({ first: "some", last: "thing"});
        expect( util.splitInObject("|back |slash\\|df |", "|", ["first", "last"]) ).toEqual({ first: "back", last: "slash|df"});
    });
});