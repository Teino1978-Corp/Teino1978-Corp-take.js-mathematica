// This is a port of an old scheme implementation of a Mathematica style 'Take' function 
// of course we don't benefit from the generics etc. of Mathematica, but it's still a useful/expressive function
// 
// Takes the same arguments documented here: http://reference.wolfram.com/mathematica/ref/Take.html
//
// Converting `Take` to a Type.js MultiMethod (https://github.com/sharkbrainguy/type.js/blob/master/multimethods.js)
// is left as an excercise to the reader
var take;
(function () {
var _take, take1, slice, index, step_through, assert, type, toString, $throw, $slice;

// (define (Take source . patterns)
//   (if (= (length patterns) 1)
//     (Take1 source (first patterns))
//     (map (lambda (source)
//            (apply Take source (rest patterns)))
//          (Take1 source (first patterns)))))
take = function (source/*, patterns...*/) {
    var patterns = $slice.call(arguments, 1);
    return _take(source, patterns);
};

take.monkeyPatch = function () {
    Array.prototype.take = function () {
        return _take(this, $slice.call(arguments));
    };
};

_take = function (source, patterns) {
    var _first = take1(source, patterns[0]),
        rest = patterns.slice(1);

    return patterns.length === 1 ? _first 
        :  _first.map(function (source) {
                return _take(source, rest);
           });
};

// (define (Take1 source pattern)
//   (match pattern
//      ['All source]
//      ['None '()]
//      [(list index) (list-ref source index)]
//      [(list first last) (slice source first last)]
//      [(list first last step) (step-through (slice source first last) step)]
//      [index (if (negative? index)
//               (slice source index)
//               (slice source 1 index))]))

take1 = function (source, pattern) {
    var _type = type(pattern), len, i, first, last, step;

    if (_type === 'string') {
        return pattern === 'All'  ? source
            :  pattern === 'None' ? []
            :  $throw(TypeError);
    }

    if (_type === 'array') {
        len = pattern.length;
        
        first = i = pattern[0]; 
        last = pattern[1];
        step = pattern[2];

        return len === 1 ? source[index(i)] 
            :  len === 2 ? slice(source, first, last)
            :  len === 3 ? step_through(slice(source, first, last), step)
            :  $throw(TypeError, "Illegal pattern: " + pattern);
    }

    if (_type === 'number') {
        return pattern < 0 ? slice(source, pattern)
            :  slice(source, 1, pattern);
    }

    throw new TypeError("Illegal pattern: " + pattern);
};

// (define (slice ls first [last (length ls)])
//   (let ([start (index ls (sub1 first))]
//         [end (index ls last)])
//     (take (drop ls start)
//           (- end start))))
slice = function (ls, first, last) {
    last = last != null ? last : ls.length;
    return ls.slice(first < 0 ? first : first - 1, last);
};

// (define (index ls n)
//   ;; converts n to an index of ls 
//   ;; by wrapping around negative numbers
//   ;; I guess I could modulo the index as well...
//   (define len (length ls))
//   (+ n (if (negative? n) len 0)))
index = function (ls, n) {
    return n + (n < 0 ? ls.length : 0);
};

// (define (step-through ls step)
//   ;; returns the 1st item, then every stepth item
//   (if (<= (length ls) step)
//     (list (first ls))
//     (cons (first ls)
//           (step-through (drop ls step) step))))
step_through = function (ls, step) {
    var result = [], i, max;

    for (i = 0, max = ls.length; i < max; i += step) {
        result.push(ls[i]);
    }

    return result;
};

// Utility functions
toString = {}.toString;
$slice = [].slice;

type = function (val) {
    // The internal property [[Class]] of a given javascript
    // object is a reliable way to identify various builtins
    //
    // ECMA-262 8.6.2 discusses the internal properties
    // common to all Ecmascript Objects including [[Class]]
    //
    // ECMA-262 15.2.4.2 discusses the use of
    // Object.prototype.toString to observe [[Class]]

    return val == (void 0) ? String(val)
        :  toString.call(val).slice(8, -1).toLowerCase();
};

$throw = function (Type, message) {
    throw new Type(message);
};

// Tests
if (typeof require && (assert = require('assert'))) {
    // (Take '(a b c d) 2) ; -> '(a b)
    assert.deepEqual(take(['a', 'b', 'c', 'd'], 2), 
                     ['a', 'b']);

    // (Take '(a b c d) -2) ; -> '(c d)
    assert.deepEqual(take(['a', 'b', 'c', 'd'], -2), ['c', 'd']);

    // (Take '(a b c d) '(1 3)) ; -> '(a b c)
    assert.deepEqual(take(['a', 'b', 'c', 'd'], [1, 3]), ['a', 'b', 'c']);

    // (Take '(a b c d) '(1 -1 2)) ; -> '(a c)
    assert.deepEqual(take(['a', 'b', 'c', 'd'],
                          [1, -1, 2]),
                     ['a', 'c']);

    // (Take '((a b c d) (1 2 3 4) (5 6 7 8)) 2 2) ;-> ((a b) (1 2))
    assert.deepEqual(take([['a', 'b', 'c', 'd'],
                           [1, 2, 3, 4],
                           [5, 6, 7, 8]], 
                           
                           2, 2),
                     [['a', 'b'], [1, 2]]);

    // (Take '((11 12 13) (21 22 23) (31 32 33)) 'All 2) ;-> ((11 12) (21 22) (31 32))
    assert.deepEqual(take([[11, 12, 13], [21, 22, 23], [31, 32, 33]], 'All', 2), 
                     [[11, 12], [21, 22], [31, 32]]);

    // (Take '((11 12 13) (21 22 23) (31 32 33)) 2 -1) ;-> ((13) (23))
    assert.deepEqual(take([[11, 12, 13], [21, 22, 23], [31, 32, 33]], 2, -1),
                     [[13], [23]]);
}
}());
