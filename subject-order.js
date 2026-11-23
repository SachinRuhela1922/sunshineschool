/*
 * subject-order.js
 * ------------------------------------------------------------
 * Exam subjects ka order sambhalta hai.
 *
 * 1) Same subject ke parts hamesha ek saath:
 *      Hindi(O), English(O), Hindi(W), English(W)
 *   -> Hindi(O), Hindi(W), English(O), English(W)
 *
 *    "Hindi(O)", "Hindi (W)", "Hindi - Oral", "HINDI [W]" -> sab ka base "hindi"
 *
 * 2) Subject ko upar/neeche (button ya drag) karne par poora group
 *    sahi jagah chala jaata hai.
 *
 * 3) Ek student ka order baaki sab students par lagaya ja sakta hai.
 *
 * NOTE: Mobile app me bhi yahi logic hai (sunshine-mobile/src/utils/subjectOrder.js).
 *       Ek me change karo to dusre me bhi karna.
 */
(function (global) {

    // "Hindi(O)" -> "hindi",  "English - Written" -> "english"
    function subjectBaseName(name) {
        return String(name || "")
            .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*$/, "")                                   // (O) / [W]
            .replace(/\s*[-–:]\s*(o|w|oral|written|theory|practical|th|pr)\.?\s*$/i, "")   // - Oral / - W
            .trim()
            .toLowerCase();
    }

    /**
     * Same base wale subjects ko ek saath karta hai (stable).
     * Groups ka order = group ka pehla subject list me kahan hai.
     * anchorIndex diya ho to us subject ka group uski position se decide hota hai
     * (jo subject abhi move/drag kiya gaya).
     */
    function groupSubjectsByBase(list, anchorIndex) {
        const items = (list || []).map((name, index) => {
            const base = subjectBaseName(name);
            return { name, index, base: base || ("\u0000" + index) }; // khaali naam kabhi group nahi hote
        });

        const groupKey = {};
        items.forEach(item => {
            if (!(item.base in groupKey)) groupKey[item.base] = item.index;
        });

        if (anchorIndex !== undefined && anchorIndex !== null && items[anchorIndex]) {
            groupKey[items[anchorIndex].base] = anchorIndex;
        }

        return items
            .sort((a, b) => (groupKey[a.base] - groupKey[b.base]) || (a.index - b.index))
            .map(item => item.name);
    }

    // from wale subject ko to par le jao, phir groups theek karo
    function moveSubjectInList(list, from, to) {
        const copy = [...(list || [])];
        if (from === to || from < 0 || to < 0 || from >= copy.length || to >= copy.length) return copy;
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        return groupSubjectsByBase(copy, to);
    }

    // Ek subject ek step upar (-1) / neeche (+1)
    function stepSubjectInList(list, index, direction) {
        const copy = [...(list || [])];
        const target = index + direction;
        if (target < 0 || target >= copy.length) return copy;

        const base = subjectBaseName(copy[index]);
        const targetBase = subjectBaseName(copy[target]);

        // Apne hi group ke andar: bas jagah badlo
        if (base && base === targetBase) {
            [copy[index], copy[target]] = [copy[target], copy[index]];
            return copy;
        }

        // Group ki boundary par: poora group, pados wale group ke us paar
        const blockOf = (i) => {
            const b = subjectBaseName(copy[i]) || ("\u0000" + i);
            let start = i, end = i;
            while (start > 0 && (subjectBaseName(copy[start - 1]) || "\u0000" + (start - 1)) === b) start--;
            while (end < copy.length - 1 && (subjectBaseName(copy[end + 1]) || "\u0000" + (end + 1)) === b) end++;
            return [start, end];
        };

        const [s1, e1] = blockOf(index);
        const [s2, e2] = blockOf(target);
        const mine = copy.slice(s1, e1 + 1);
        const other = copy.slice(s2, e2 + 1);

        if (direction < 0) {
            return [...copy.slice(0, s2), ...mine, ...other, ...copy.slice(e1 + 1)];
        }
        return [...copy.slice(0, s1), ...other, ...mine, ...copy.slice(e2 + 1)];
    }

    // Kisi student ke subjects ko master order ke hisaab se lagao
    // (jo subject master me nahi, wo apni purani relative jagah par peeche)
    function applySubjectOrder(list, master) {
        const pos = {};
        (master || []).forEach((name, i) => {
            const key = String(name || "").trim().toLowerCase();
            if (key && !(key in pos)) pos[key] = i;
        });
        const items = (list || []).map((name, index) => ({ name, index }));
        const big = (master || []).length;
        items.sort((a, b) => {
            const pa = pos[String(a.name || "").trim().toLowerCase()];
            const pb = pos[String(b.name || "").trim().toLowerCase()];
            return ((pa === undefined ? big + a.index : pa) - (pb === undefined ? big + b.index : pb)) || (a.index - b.index);
        });
        return groupSubjectsByBase(items.map(i => i.name));
    }

    // Saved marks array ko diye gaye subject order me lagao
    function orderMarksBySubjects(marks, subjectOrder) {
        const order = applySubjectOrder((marks || []).map(m => m.subjectName), subjectOrder);
        const pool = [...(marks || [])];
        const result = [];
        order.forEach(name => {
            const i = pool.findIndex(m => m.subjectName === name);
            if (i !== -1) result.push(pool.splice(i, 1)[0]);
        });
        return result.concat(pool);
    }

    function sameOrder(a, b) {
        if ((a || []).length !== (b || []).length) return false;
        return a.every((x, i) => x === b[i]);
    }

    global.SubjectOrder = {
        subjectBaseName,
        groupSubjectsByBase,
        moveSubjectInList,
        stepSubjectInList,
        applySubjectOrder,
        orderMarksBySubjects,
        sameOrder
    };

})(window);
