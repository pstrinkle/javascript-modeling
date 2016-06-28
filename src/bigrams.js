/**
 * URL: http://pstrinkle.github.io/js-modeling
 * Author: Patrick Trinkle <https://github.com/pstrinkle>
 * Version: 1.0.0
 * Copyright 2016 Patrick Trinkle
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(w) {
    "use strict";
    /**
     * Initially a super basic bigrams text generative model.
     */
    w.Bigrams = {
        /**
         * Where we store the current model.
         *
         * Super silly and easy.  Likely will come up with a better approach.
         *
         * It is a two-deep object.  Since it needs to be sorted for speedup, I'll
         * likely have that operation occur whenever it learns from a new document.
         */
        bigrams: {},

        getBigrams: function() {
            return this.bigrams;
        },

        addBigram: function(now, next) {
            if (this.bigrams[now] == undefined) {
                this.bigrams[now] = {};
            }

            if (this.bigrams[now][next] == undefined) {
                this.bigrams[now][next] = 0;
            }

            this.bigrams[now][next] += 1;
        },

        cleanup: function(d) {
            return d;
        },

        /**
         * Build a bigram model based on this initial input,
         * you can add more data to the model if you want later.
         */
        init: function(d) {
            var bigrams = {};

            d = this.cleanup(d, false);

            /* process each sentence. */
            var sentences = d.split(' . ');
            for (var s = 0; s < sentences.length; s++) {
                var words = [];
                var terms = sentences[s].split(' '); /* could be '' in there. */

                for (var i = 0; i < terms.length; i++) {
                    if (terms[i] === '' || terms[i] === ' ') {
                        continue;
                    }

                    var l = terms[i].toLowerCase();
                    words.push(l);
                }

                if (words.length < 2) {
                    continue;
                }

                /* handle edge case: sentence starts with. */
                this.addBigram('|', words[0]);

                for (i = 0; i < (words.length-1); i++) {
                    var t0 = words[i];
                    var t1 = words[i+1];
                    this.addBigram(t0, t1);
                }
            }

            return;
        },

        /**
         * Given what it knows so far, and providing the current word, return
         * what it thinks will be the next word (the one with the highest probability)
         *
         * ... need to re-examine the posterior probabilities.
         */
        generate: function(curr) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
            // Returns a random number between min (inclusive) and max (exclusive)
            var getRandomArbitrary = function(min, max) {
              return Math.random() * (max - min) + min;
            }

            var options = [];
            var totalCnts = 0;
            var percentage = 0.0;
            var random_num = getRandomArbitrary(0, 1);

            curr = curr.toLowerCase();

            /* we have no idea..., could rely on part-of-speech, or a few other 
             * options.
             */
            if (this.bigrams[curr] == undefined) {
                return ".";
            }

            var available = Object.keys(this.bigrams[curr]);

            for (var i = 0; i < available.length; i++) {
                var t = available[i];
                var c = this.bigrams[curr][t];
                options.push([t, c]);
                totalCnts += c;
            }

            for (var i = 0; i < options.length; i++) {
            	var o = options[i]; // [0] == letter, [1] == count
            	percentage += (o[1] / totalCnts);
            	if (random_num <= percentage) {
            		return o[0];
            	}
            }
        },
    };
})(this);
