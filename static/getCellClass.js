export function getCellClass(
    fieldValue,
    secretValue,
    isYear = false
) {
    if (!fieldValue || !secretValue) {
        return "wrong";
    }

    // YEAR LOGIC

    if (isYear) {
        const guessYear = parseInt(fieldValue);
        const secretYear = parseInt(secretValue);

        if (
            isNaN(guessYear) ||
            isNaN(secretYear)
        ) {
            return "wrong";
        }

        if (guessYear === secretYear) {
            return "correct";
        }

        if (guessYear < secretYear) {
            return "newer";
        }

        return "older";
    }


    const fieldList = fieldValue
        .toString()
        .split(",")
        .map(s => s.trim().toLowerCase())
        .sort();


    const secretList = secretValue
        .toString()
        .split(",")
        .map(s => s.trim().toLowerCase())
        .sort();


    if (
        JSON.stringify(fieldList) ===
        JSON.stringify(secretList)
    ) {
        return "correct";
    }


    const intersection =
        fieldList.filter(item =>
            secretList.includes(item)
        );


    const humanMetaMatch =
        (
            fieldList.includes("human") &&
            secretList.includes("metahuman")
        ) ||
        (
            fieldList.includes("metahuman") &&
            secretList.includes("human")
        );


    if (
        intersection.length > 0 ||
        humanMetaMatch
    ) {
        return "partial";
    }


    return "wrong";
}