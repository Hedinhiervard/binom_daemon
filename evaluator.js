/**
 * This class evaluate the boolean complex expressions against the object
 * to detect if the object complies with the rules
 */
export default class Evaluator {
    /**
     * Checks the object against OR expression
     * @param  {Object} entity     the object in question
     * @param  {Array} expression  Array of expressions to OR
     * @return {boolean}           `true` if the object complies, `false` otherwise
     */
    evaluateOr(entity, expression) {
        // console.log(entity);
        // console.log(`evaluating OR: ${JSON.stringify(expression)}`)
        for(const component of expression) {
            if(this.evaluate(entity, component)) {
                // console.log(` OR result: TRUE`)
                return true;
            }
        }
        // console.log(` OR result: FALSE`)
        return false;
    }

    /**
     * Checks the object against AND expression
     * @param  {Object} entity     the object in question
     * @param  {Array} expression  Array of expressions to AND
     * @return {boolean}           `true` if the object complies, `false` otherwise
     */
    evaluateAnd(entity, expression) {
        // console.log(`evaluating AND: ${JSON.stringify(expression)}`)
        for(const component of expression) {
            if(!this.evaluate(entity, component)) {
                // console.log(` AND result: FALSE`)
                return false;
            }
        }
        // console.log(`AND result: TRUE`)
        return true;
    }

    /**
     * Checks the object against the atomic expression,
     * e.g. ['field', '>', 5]
     * @param  {Object} entity     the object in question
     * @param  {Array} expression  Array of 3 items: `field`, `operator` and `value` to compare with
     * @return {boolean}           `true` if the object complies, `false` otherwise
     */
    evaluateAtom(entity, expression) {
        // console.log(`evaluating ATOM: ${JSON.stringify(expression)}`)
        const [ field, operator, value ] = expression;
        let result;
        if(operator === '=') {
            result = entity[field] === value;
        } else if(operator === '>=') {
            result = entity[field] >= value;
        } else if(operator === '<=') {
            result = entity[field] <= value;
        } else if(operator === '>') {
            result = entity[field] > value;
        } else if(operator === '<') {
            result = entity[field] < value;
        } else {
            throw new Error(`unknown operator ${operator}`);
        }
        // console.log(`ATOM result: ${result}`);
        return result;
    }

    /**
     * Checks the object against any expression
     * @param  {Object} entity     the object in question
     * @param  {Array} expression  a generic boolean expression (AND, OR or atomic)
     * @return {boolean}           `true` if the object complies, `false` otherwise
     */
    evaluate(entity, expression) {
        if(expression[0] === 'AND') return this.evaluateAnd(entity, expression.filter((element, index) => index > 0));
        if(expression[0] === 'OR') return this.evaluateOr(entity, expression.filter((element, index) => index > 0));
        return this.evaluateAtom(entity, expression);
    }

    /**
     * Returns a function to check its input `entity` agains `expression`
     * @param  {Array} expression  a generic boolean expression (AND, OR or atomic)
     * @return {function<Object>} function taking an object `entity` argument which checks `entity` agains `expression` and returns `boolean`
     */
    compile(expression) {
        return entity => this.evaluate(entity, expression);
    }
}
