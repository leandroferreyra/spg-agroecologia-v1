import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arrayToString',
  standalone: true
})
export class ArrayToStringPipe implements PipeTransform {

  // Se pasa un array de objetos y se devuelva en forma de lista separado por coma.

  transform(value: any[], attribute: string, separator: string = ', '): string {
    if (!Array.isArray(value)) {
      return '';
    }
    return value.map(item => item[attribute]).join(separator);
  }

}
