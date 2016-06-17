/**
 * URL: http://pstrinkle.github.io/javascript-modeling
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
    /**
     * Allows building a VectorSpace model of documents provided...
     *
     * The initial goal was to make just a basic representation entirely on the
     * client, however it serves no real purpose.  I was thinking of a couple fun
     * ideas:
     * 
     * 1) You provide it with emails you've written and it attempts predictive
     * test via a bigrams options.
     *
     * 2) You provide it with a series of documents and it becomes a search engine,
     * but could also tell you from the submitted documents which terms are the 
     * most frequent and which are the most descriptive about a given piece of text,
     * which does have some value.
     */
    w.VectorSpace = {
        /**************************************************************************/
        /**
         * An object of objects, each has 'tf', 'data' where data is the 
         * tf-idf representation for the terms in the document...
         *
         * corpus[name].tf, corpus[name].data
         */
        corpus: {},

        listCorpus: function() {
            return Object.keys(this.corpus);
        },
        getDocument: function(name) {
            return this.corpus[name].doc;
        },
        getDocumentTf: function(name) {
            return this.corpus[name].tf;
        },

        emptyCorpus: function() {
            var docs = Object.keys(this.corpus);
            var fs = Object.keys(this.documentFreqs);
            var os = Object.keys(this.documentOccurs);
            
            for (var i = 0; i < docs.length; i++) {
                delete this.corpus[docs[i]];
            }
            for (i = 0; i < fs.length; i++) {
                delete this.documentFreqs[fs[i]];
            }
            for (i = 0; i < os.length; i++) {
                delete this.documentOccurs[os[i]];
            }
        },
        
        /**
         * The number of documents in which this word appears.
         * 
         * documentFreqs[term] = cnt
         */
        documentFreqs: {},
        /**
         * The documents in which a term appears.  To speedup querying.
         * 
         * documentOccurs[term] = [doc, doc, doc, ...]
         */
        documentOccurs: {},
        /**
         * Add document to the corpus.
         *
         * It adds the document to the corpus and then triggers a document
         * update.
         */
        addDocument: function(name, d) {
            var vec = this.process(d);
            var nterms = Object.keys(vec);
            /* this step could go into process, it'd just need another
             * parameter to determine if it should or not.
             */
            for (var i = 0; i < nterms.length; i++) {
                var t = nterms[i];
                
                if (this.documentFreqs[t] == undefined) {
                    this.documentFreqs[t] = 0;
                    
                    this.documentOccurs[t] = [];
                }

                this.documentFreqs[t] += 1;
                this.documentOccurs[t].push(name);
            }

            var entry = {
                doc: d,
                tf: vec,
                data: {}, /* this will be built during the update */
            };

            if (this.corpus[name] != undefined) {
                throw "Document already exists";
            }

            this.corpus[name] = entry;
            this.updateValues();

            return;
        },
        
        /**
         * We have reason to believe our tf-idf values are no longer accurate, 
         * so we need to update them.  Well, the idf portion.
         */
        updateValues: function() {
            var documents = Object.keys(this.corpus);

            for (var i = 0; i < documents.length; i++) {
                var doc = this.corpus[documents[i]];
                var terms = Object.keys(doc.tf);
                for (var j = 0; j < terms.length; j++) {
                    var t = terms[j];
                    var idf = Math.log10(1 + documents.length / this.documentFreqs[t]);
                    /* store the result. */
                    doc.data[t] = doc.tf[t] * idf;
                }
            }

            return;
        },

        query: function(q) {
            var qvec = this.process(q); /* convert string into vector, strip stopwords. */
            var docs = {};

            /* XXX: need to update the values here to have an idf of sorts. */
            var terms = Object.keys(qvec);
            for (var i = 0; i < terms.length; i++) {
                var t = terms[i];
                if (this.documentOccurs[t] == undefined) {
                    continue;
                }

                for (var j = 0; j < this.documentOccurs[t].length; j++) {
                    var n = this.documentOccurs[t][j];
                    if (docs[n] == undefined) {
                        docs[n] = 0;
                    }
                }
            }

            var d = Object.keys(docs);
            var results = [];
            for (i = 0; i < d.length; i++) {
                var res = this.cosineSimilarity(qvec, this.corpus[d[i]].data);
                results.push([d[i], res]);
            }

            var sorted = results.sort(function(a, b) {
                return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
            });

            return sorted;
        },
        
        /**************************************************************************/

        /**
         * stop words are words that are ignored in typical analysis.  However,
         * there is value in both the frequencies and positions of stop words in
         * different analyses... so the idea is to focus on one approach first.
         *
         * stored as dictionary for quicker lookup and testing that is cross-browser
         * "in" not necessarily implemented evenly.
         */
        stopwords: {},

        getStopwords: function() {
            return Object.keys(this.stopwords);
        },

        /**
         * receives a string that is a newline separated list of words.
         */
        importStopwords: function(words) {
            var nwords = this.process(words, false);
            var nobj = Object.keys(nwords);

            var docs = (Object.keys(this.corpus).length > 0) ? true: false;
            
            for (var i = 0; i < nobj.length; i++) {
                var t = nobj[i];
                
                if (this.stopwords[t] == undefined) {
                    this.stopwords[t] = 1;
                }
                
                if (docs) {
                    if (this.documentFreqs[t]) {
                        delete this.documentFreqs[t];
                    }
                    if (this.documentOccurs[t]) {
                        for (var j = 0; j < this.documentOccurs[t].length; j++) {
                            var n = this.documentOccurs[t][j];
                            delete this.corpus[n].tf[t];
                            delete this.corpus[n].data[t];
                        }

                        delete this.documentOccurs[t];
                    }
                }
            }

            return;
        },

        /**
         * Given two term weight dictionaries "vectors" compute the cosine 
         * similarity.
         */
        cosineSimilarity: function(d1, d2) {
            var dotProduct = 0.0, a_sqrs = 0.0, b_sqrs = 0.0;
            var a_words = Object.keys(d1);
            var b_words = Object.keys(d2);

            for (var i = 0; i < a_words.length; i++) {
                var t = a_words[i];
                a_sqrs += (d1[t] * d1[t]);

                if (d2[t] != undefined) {
                    dotProduct += d1[t] * d2[t]
                }
            }

            for (i = 0; i < b_words.length; i++) {
                var t = b_words[i];
                b_sqrs += (d2[t] * d2[t]);
            }

            var a_sqrt = Math.sqrt(a_sqrs);
            var b_sqrt = Math.sqrt(b_sqrs);

            return (dotProduct / (a_sqrt * b_sqrt))
        },
        
        cleanup: function(d) {
            return d;
        },

        /**
         * Given a string, it splits it into words and returns a term weight
         * dictionary, such that term weight is 0.5 + (0.5 * tw/max)
         *
         * It doesn't normalize anything yet based on the document length.
         *
         * d := the string
         * stop := boolean whether to care about stopwords.
         */
        process: function(d, stop = true) {
            d = this.cleanup(d);

            /* probably does leave some words that are ' ' */
            var words = d.split(' ');
            var vector = {};
            var total = 0;

            for (i = 0; i < words.length; i++) {
                if (words[i] === '' || words[i] === ' ') {
                     continue;
                }

                var l = words[i].toLowerCase();

                /* if we care about stop words, and it's not undefined, skip */
                if (stop && this.stopwords[l] != undefined) {
                    continue;
                }

                if (vector[l] === undefined) {
                    vector[l] = 0;
                }

                vector[l] += 1;
                total += 1;
            }

            var max = 0.0;
            var s = Object.keys(vector);

            /* it might make sense to return [(t, w), (t, w), ...]. */
            for (i = 0; i < s.length; i++) {
                if (vector[s[i]] > max) {
                    max = vector[s[i]];
                }
            }

            /* by using max, if a string is two words, the term weights are
             * both 1.  which I don't know.  I feel like they should add up
             * to 100, making them more of a term weight versus a normalized
             * term frequency.  normalized in the sense that every term was
             * reduced by the maximum count setting the maximum count to 1.
             *
             * 
             */
            for (i = 0; i < s.length; i++) {
                var c = vector[s[i]];
                vector[s[i]] = 0.5 + (0.5 * (c / max));
            }

            return vector;
        }
    };
})(this);
