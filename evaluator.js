export default class Evaluator {
    applyOr(entity, expression) {
        // console.log(entity);
        // console.log(`evaluating OR: ${JSON.stringify(expression)}`)
        for(const component of expression) {
            if(this.applyAnd(entity, component)) {
                // console.log(` OR result: TRUE`)
                return true;
            }
        }
        // console.log(` OR result: FALSE`)
        return false;
    }

    applyAnd(entity, expression) {
        // console.log(`evaluating AND: ${JSON.stringify(expression)}`)
        for(const component of expression) {
            if(!this.applyAtom(entity, component)) {
                // console.log(` AND result: FALSE`)
                return false;
            }
        }
        // console.log(`AND result: TRUE`)
        return true;
    }

    applyAtom(entity, expression) {
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

    compile(expression) {
        return entity => this.applyOr(entity, expression);
    }
}
